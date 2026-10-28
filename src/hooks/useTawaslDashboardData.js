import { validateSession, localDateInput } from "../utils/sessionValidation.js";
import { saveSpecialistRecord, saveSessionStatus } from "../services/specialistWrites";
// src/hooks/useTawaslDashboardData.js
// ============================================================
// يجيب بيانات داشبورد الأخصائي الحالي (المسجّل دخول) فقط —
// حالاته هو، جلساته هو، تقاريره هو. مفيش عرض لأخصائيين تانيين
// (قرار خصوصية/معماري تم الاتفاق عليه).
//
// ⚠️ ملاحظات:
// - "نسبة التقدم" لكل حالة بتتحسب من نسبة مهام النهاردة المخلّصة
//   (نفس منطق ParentDashboard) لحد ما يبقى عندنا مصدر أدق.
// - "حالة المتابعة" (مهام أقل من 45٪/مهام من 45٪ إلى 74٪/مهام 75٪ فأكثر) قيمة محسوبة من
//   نسبة التقدم، مش عمود مخزّن فعلياً.
// ============================================================
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

function todayStr() {
  return localDateInput();
}

function deriveStatus(pct) {
  if (pct >= 75) return "مهام 75٪ فأكثر";
  if (pct >= 45) return "مهام من 45٪ إلى 74٪";
  return "مهام أقل من 45٪";
}

export function useTawaslDashboardData() {
  const { profile } = useAuth();
  const pendingTransitions = useRef(new Set());
  const [specialist, setSpecialist] = useState(null);
  const [cases, setCases] = useState([]);
  const [sessionsToday, setSessionsToday] = useState([]);
  const [sessionDate, setSessionDate] = useState(localDateInput);
  const [sessionsForDate, setSessionsForDate] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    setError(null);
    try {
      const today = todayStr();

      const [specRes, linksRes, sessionsRes, reportsRes, selectedSessionsRes] = await Promise.all([
        supabase.from("specialists").select("*").eq("id", profile.id).single(),
        supabase.from("specialist_children").select("child_id, children(*)").eq("specialist_id", profile.id).eq("status", "active"),
        supabase.from("sessions").select("*, children(full_name)").eq("specialist_id", profile.id).eq("session_date", today).order("created_at", { ascending: true }),
        supabase.from("reports").select("*, children(full_name)").eq("specialist_id", profile.id).order("created_at", { ascending: false }),
        sessionDate === today ? Promise.resolve(null) : supabase.from("sessions").select("*, children(full_name)").eq("specialist_id", profile.id).eq("session_date", sessionDate).order("session_time", { ascending: true }),
      ]);

      if (specRes.error || !specRes.data) {
        throw new Error("تعذر تحميل ملف الأخصائي. أعد المحاولة، وإذا استمرت المشكلة تواصل مع إدارة المنصة لمراجعة إعداد الحساب.");
      }
      if ([linksRes, sessionsRes, reportsRes, ...(selectedSessionsRes ? [selectedSessionsRes] : [])].some(result => result.error)) {
        throw new Error("تعذر تحميل الحالات أو الجلسات أو التقارير. تحقق من الاتصال وأعد المحاولة.");
      }
      setSpecialist({ ...specRes.data, name: profile.Full_name });

      const childIds = (linksRes.data || []).map((l) => l.child_id);

      let progressByChild = {};
      let moodByChild = {};
      let lastSessionByChild = {};

      if (childIds.length > 0) {
        const activityResults = await Promise.all([
          supabase.from("daily_tasks").select("child_id, done").in("child_id", childIds).eq("task_date", today),
          supabase.from("mood_logs").select("child_id, mood, logged_at").in("child_id", childIds).order("logged_at", { ascending: false }),
          supabase.from("sessions").select("child_id, session_date").in("child_id", childIds).lte("session_date", today).order("session_date", { ascending: false }),
        ]);

        if (activityResults.some(result => result.error)) {
          throw new Error("تعذر تحميل نشاط الحالات. أعد المحاولة قبل الاعتماد على نسب التقدم.");
        }
        const [{ data: tasks }, { data: moods }, { data: allSessions }] = activityResults;

        (tasks || []).forEach((t) => {
          progressByChild[t.child_id] = progressByChild[t.child_id] || { done: 0, total: 0 };
          progressByChild[t.child_id].total++;
          if (t.done) progressByChild[t.child_id].done++;
        });

        (moods || []).forEach((m) => {
          if (!moodByChild[m.child_id]) moodByChild[m.child_id] = m.mood;
        });

        (allSessions || []).forEach((s) => {
          if (!lastSessionByChild[s.child_id]) lastSessionByChild[s.child_id] = s.session_date;
        });
      }

      const builtCases = (linksRes.data || []).map((l) => {
        const p = progressByChild[l.child_id];
        const pct = p && p.total > 0 ? Math.round((p.done / p.total) * 100) : 0;
        return {
          id: l.child_id,
          childName: l.children?.full_name || "—",
          ageYears: l.children?.age ?? "—",
          progressPercent: pct,
          status: deriveStatus(pct),
          mood: moodByChild[l.child_id] || "—",
          lastSession: lastSessionByChild[l.child_id]
            ? new Date(lastSessionByChild[l.child_id]).toLocaleDateString("ar-EG", { day: "numeric", month: "short" })
            : "لسه مفيش",
        };
      });
      setCases(builtCases);

      const mapSessions = (rows) => (rows || []).map((s) => ({
        id: s.id, childName: s.children?.full_name || "—", time: s.session_time,
        durationMin: s.duration_minutes,
        status: s.status === "completed" ? "منتهية" : s.status === "in_progress" ? "جارية" : s.status === "cancelled" ? "ملغاة" : "قادمة",
        type: s.type || "—",
      })).sort((a, b) => String(a.time).localeCompare(String(b.time)));
      setSessionsToday(mapSessions(sessionsRes.data));
      setSessionsForDate(mapSessions((selectedSessionsRes || sessionsRes).data));

      setReports(
        (reportsRes.data || []).map((r) => ({
          id: r.id,
          childName: r.children?.full_name || "—",
          date: new Date(r.created_at).toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" }),
          progressPercent: r.metrics?.progress ?? 0,
          summary: r.content || "",
          recommendations: r.metrics?.recommendations || [],
        }))
      );
    } catch (e) {
      setError(e.message || "حصل خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, [profile, sessionDate]);

  useEffect(() => {
    const timer = setTimeout(() => { load(); }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  async function createSession({ childId, date, time, duration, type }) {
    if (!profile?.id) return { error: "بيانات المستخدم لسه بتتحمّل" };
    const validationError = validateSession({ childId, date, time, duration, type });
    if (validationError) return { error: validationError };
    const result = await saveSpecialistRecord(supabase, "sessions", {
      specialist_id: profile.id,
      child_id: childId,
      session_date: date,
      session_time: time,
      duration_minutes: duration,
      type,
      status: "scheduled",
    });
    if (!result.error) {
      if (date !== sessionDate) setSessionDate(date);
      else void load();
    }
    return result;
  }

  async function updateSessionStatus(sessionId, status) {
    if (pendingTransitions.current.has(sessionId)) return { error: "جاري تحديث الجلسة بالفعل." };
    pendingTransitions.current.add(sessionId);
    try {
      const result = await saveSessionStatus(supabase, { sessionId, specialistId: profile?.id, status });
      if (!result.error) await load();
      return result;
    } finally {
      pendingTransitions.current.delete(sessionId);
    }
  }

  async function createReport({ childId, content, progress, recommendations }) {
    if (!profile?.id) return { error: "بيانات المستخدم لسه بتتحمّل" };
    const recArray = (recommendations || "").split(",").map((s) => s.trim()).filter(Boolean);
    const result = await saveSpecialistRecord(supabase, "reports", {
      specialist_id: profile.id,
      child_id: childId,
      report_type: "note",
      content,
      metrics: { progress: Number(progress) || 0, recommendations: recArray },
    });
    if (!result.error) void load();
    return result;
  }

  return {
    specialist,
    cases,
    sessionsToday,
    sessionsForDate,
    sessionDate,
    setSessionDate,
    reports,
    loading,
    error,
    createSession,
    updateSessionStatus,
    createReport,
    refresh: load,
  };
}
