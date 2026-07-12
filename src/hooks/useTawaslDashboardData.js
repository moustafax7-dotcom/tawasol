// src/hooks/useTawaslDashboardData.js
// ============================================================
// يجيب بيانات داشبورد الأخصائي الحالي (المسجّل دخول) فقط —
// حالاته هو، جلساته هو، تقاريره هو. مفيش عرض لأخصائيين تانيين
// (قرار خصوصية/معماري تم الاتفاق عليه).
//
// ⚠️ ملاحظات:
// - "نسبة التقدم" لكل حالة بتتحسب من نسبة مهام النهاردة المخلّصة
//   (نفس منطق ParentDashboard) لحد ما يبقى عندنا مصدر أدق.
// - "حالة المتابعة" (يحتاج متابعة/مستقر/ممتاز) قيمة محسوبة من
//   نسبة التقدم، مش عمود مخزّن فعلياً.
// ============================================================
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function deriveStatus(pct) {
  if (pct >= 75) return "ممتاز";
  if (pct >= 45) return "مستقر";
  return "يحتاج متابعة";
}

export function useTawaslDashboardData() {
  const { profile } = useAuth();
  const [specialist, setSpecialist] = useState(null);
  const [cases, setCases] = useState([]);
  const [sessionsToday, setSessionsToday] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    setError(null);
    try {
      const today = todayStr();

      const [specRes, linksRes, sessionsRes, reportsRes] = await Promise.all([
        supabase.from("specialists").select("*").eq("id", profile.id).single(),
        supabase.from("specialist_children").select("child_id, children(*)").eq("specialist_id", profile.id).eq("status", "active"),
        supabase.from("sessions").select("*, children(full_name)").eq("specialist_id", profile.id).eq("session_date", today).order("created_at", { ascending: true }),
        supabase.from("reports").select("*, children(full_name)").eq("specialist_id", profile.id).order("created_at", { ascending: false }),
      ]);

      setSpecialist({ ...specRes.data, name: profile.Full_name });

      const childIds = (linksRes.data || []).map((l) => l.child_id);

      let progressByChild = {};
      let moodByChild = {};
      let lastSessionByChild = {};

      if (childIds.length > 0) {
        const [{ data: tasks }, { data: moods }, { data: allSessions }] = await Promise.all([
          supabase.from("daily_tasks").select("child_id, done").in("child_id", childIds).eq("task_date", today),
          supabase.from("mood_logs").select("child_id, mood, logged_at").in("child_id", childIds).order("logged_at", { ascending: false }),
          supabase.from("sessions").select("child_id, session_date").in("child_id", childIds).lte("session_date", today).order("session_date", { ascending: false }),
        ]);

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

      setSessionsToday(
        (sessionsRes.data || []).map((s) => ({
          id: s.id,
          childName: s.children?.full_name || "—",
          time: s.session_time,
          durationMin: s.duration_minutes,
          status: s.status === "completed" ? "منتهية" : s.status === "in_progress" ? "جارية" : s.status === "cancelled" ? "ملغاة" : "قادمة",
          type: s.type || "—",
        }))
      );

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
  }, [profile?.id]);

  useEffect(() => { load(); }, [load]);

  async function createSession({ childId, date, time, duration, type }) {
    if (!profile?.id) return { error: "بيانات المستخدم لسه بتتحمّل" };
    const { error } = await supabase.from("sessions").insert({
      specialist_id: profile.id,
      child_id: childId,
      session_date: date,
      session_time: time,
      duration_minutes: duration,
      type,
      status: "scheduled",
    });
    if (!error) load();
    return { error: error?.message || null };
  }

  async function updateSessionStatus(sessionId, status) {
    await supabase.from("sessions").update({ status }).eq("id", sessionId);
    load();
  }

  async function createReport({ childId, content, progress, recommendations }) {
    if (!profile?.id) return { error: "بيانات المستخدم لسه بتتحمّل" };
    const recArray = (recommendations || "").split(",").map((s) => s.trim()).filter(Boolean);
    const { error } = await supabase.from("reports").insert({
      specialist_id: profile.id,
      child_id: childId,
      report_type: "note",
      content,
      metrics: { progress: Number(progress) || 0, recommendations: recArray },
    });
    if (!error) load();
    return { error: error?.message || null };
  }

  return {
    specialist,
    cases,
    sessionsToday,
    reports,
    loading,
    error,
    createSession,
    updateSessionStatus,
    createReport,
    refresh: load,
  };
}
