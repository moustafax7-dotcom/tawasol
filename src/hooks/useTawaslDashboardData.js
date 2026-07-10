import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

/**
 * useTawaslDashboardData
 * ------------------------------------------------------------------------
 * بيانات داشبورد الأخصائي — كل حاجة هنا مقصوصة على الأخصائي المسجّل دخول بس
 * (specialist_id = profile.id)، متوافق مع سياسات الـ RLS.
 *
 * زي useKidsDashboardData و useParentDashboardData بالظبط: بناخد
 * الـ profile (وبالتالي id + Full_name) من useAuth() بدل ما نعمل
 * query منفصل لجدول profiles هنا — ده بيقلّل مكان ممكن يحصل فيه
 * غلط في اسم عمود، وبيخلينا متسقين مع باقي الهوكس في المشروع.
 *
 * الجداول المستخدمة (حسب الـ schema المؤكد):
 *   profiles(id, Full_name, role, phone, created_at)  -> جاي من useAuth()
 *   specialists(id, specialization, bio, years_experience, is_verified, created_at)
 *     -> specialists.id === profiles.id === auth.users.id
 *   children(id, full_name, age, gender, disability_type, parent_id, created_at)
 *   specialist_children(id, specialist_id, child_id, status, created_at)
 *   sessions(id, child_id, specialist_id, session_date, session_time,
 *            duration_minutes, type, status, notes, created_at)
 *   reports(id, child_id, specialist_id, report_type, period_start, period_end,
 *           content, metrics jsonb, created_at)
 *   daily_tasks(id, child_id, task_date, task_key, emoji, label, done)
 *
 * ⚠️ افتراضات محتاجة تأكيد منك (اتعلقت عليها مكانها في الكود):
 *   1. specialist_children.status متخزن كنص عربي جاهز (زي "يحتاج متابعة"،
 *      "مستقر"، "ممتاز"، "جديد"). لو مخزن إنجليزي غيّر CASE_STATUS_MAP.
 *   2. reports.metrics هو jsonb فيه progressPercent + recommendations[].
 *      لو الأسماء مختلفة غيّر extractReportMetrics().
 *   3. "stage" (المرحلة) مفيهاش عمود حقيقي، فبنشتقّها من نسبة التقدّم
 *      (heuristic) في deriveStage(). عدّلها لو عندك مصدر حقيقي للمرحلة.
 * ------------------------------------------------------------------------
 */

const SESSION_STATUS_MAP = {
  scheduled: "قادمة",
  in_progress: "جارية",
  completed: "منتهية",
  cancelled: "ملغاة",
};
const SESSION_STATUS_MAP_REVERSE = Object.fromEntries(
  Object.entries(SESSION_STATUS_MAP).map(([k, v]) => [v, k])
);

function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

// "10:00 ص" / "2:30 م" -> دقايق من نص الليل، لغرض الترتيب بس
function parseSessionTimeToMinutes(t) {
  if (!t) return Number.MAX_SAFE_INTEGER;
  const match = t.match(/(\d{1,2}):(\d{2})\s*(ص|م)?/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  let [, h, m, period] = match;
  h = parseInt(h, 10);
  m = parseInt(m, 10);
  if (period === "م" && h !== 12) h += 12;
  if (period === "ص" && h === 12) h = 0;
  return h * 60 + m;
}

function deriveStage(progressPercent) {
  if (progressPercent >= 80) return "المرحلة المتقدمة";
  if (progressPercent >= 40) return "مرحلة المتابعة";
  return "المرحلة الأولى";
}

function extractReportMetrics(metrics) {
  // metrics متوقع يكون: { progressPercent: number, recommendations: string[] }
  const progressPercent =
    typeof metrics?.progressPercent === "number" ? metrics.progressPercent : 0;
  const recommendations = Array.isArray(metrics?.recommendations)
    ? metrics.recommendations
    : [];
  return { progressPercent, recommendations };
}

function formatDateAr(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("ar-EG", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function useTawaslDashboardData() {
  const { profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [specialization, setSpecialization] = useState(null);

  const [cases, setCases] = useState([]);
  const [todaySessions, setTodaySessions] = useState([]);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({
    activeCases: 0,
    todaySessionsCount: 0,
    urgentCases: 0,
    avgProgress: 0,
  });

  const fetchAll = useCallback(async () => {
    if (!profile?.id) return; // لسه بيانات المستخدم بتتحمّل من الـ AuthContext

    setLoading(true);
    setError(null);
    try {
      const specialistId = profile.id;

      // ── 1) تخصص الأخصائي (اختياري، من جدول specialists) ──────────────
      const { data: specialistRow, error: specErr } = await supabase
        .from("specialists")
        .select("specialization")
        .eq("id", specialistId)
        .maybeSingle();
      if (specErr) throw specErr;

      // ── 2) حالات الأخصائي (specialist_children + children) ──────────
      const { data: caseRows, error: casesErr } = await supabase
        .from("specialist_children")
        .select("id, status, child_id, children(id, full_name, age, disability_type)")
        .eq("specialist_id", specialistId);
      if (casesErr) throw casesErr;

      const childIds = (caseRows ?? []).map((c) => c.child_id).filter(Boolean);

      // ── 3) تقدّم اليوم من daily_tasks لكل طفل ────────────────────────
      let progressByChild = {};
      if (childIds.length > 0) {
        const { data: taskRows, error: tasksErr } = await supabase
          .from("daily_tasks")
          .select("child_id, done")
          .eq("task_date", todayStr())
          .in("child_id", childIds);
        if (tasksErr) throw tasksErr;

        const grouped = {};
        (taskRows ?? []).forEach((t) => {
          if (!grouped[t.child_id]) grouped[t.child_id] = { total: 0, done: 0 };
          grouped[t.child_id].total += 1;
          if (t.done) grouped[t.child_id].done += 1;
        });
        Object.entries(grouped).forEach(([childId, { total, done }]) => {
          progressByChild[childId] = total > 0 ? Math.round((done / total) * 100) : 0;
        });
      }

      // ── 4) آخر جلسة لكل طفل (من sessions) ────────────────────────────
      let lastSessionByChild = {};
      if (childIds.length > 0) {
        const { data: sessionHistory, error: histErr } = await supabase
          .from("sessions")
          .select("child_id, session_date")
          .eq("specialist_id", specialistId)
          .in("child_id", childIds)
          .order("session_date", { ascending: false });
        if (histErr) throw histErr;

        (sessionHistory ?? []).forEach((s) => {
          if (!lastSessionByChild[s.child_id]) {
            lastSessionByChild[s.child_id] = s.session_date;
          }
        });
      }

      const mappedCases = (caseRows ?? []).map((c) => {
        const child = c.children ?? {};
        const progressPercent = progressByChild[c.child_id] ?? 0;
        return {
          id: c.id,
          childId: c.child_id,
          childName: child.full_name ?? "—",
          ageYears: child.age ?? "—",
          therapyType: child.disability_type ?? "—",
          status: c.status ?? "جديد", // ⚠️ افتراض: مخزن كنص عربي جاهز
          stage: deriveStage(progressPercent), // ⚠️ مشتقّة، مفيش عمود حقيقي
          progressPercent,
          lastSession: formatDateAr(lastSessionByChild[c.child_id]),
          specialistName: profile.Full_name ?? "أخصائي",
        };
      });

      // ── 5) جلسات اليوم ────────────────────────────────────────────────
      const { data: sessionRows, error: sessErr } = await supabase
        .from("sessions")
        .select("id, session_time, duration_minutes, type, status, child_id, children(full_name)")
        .eq("specialist_id", specialistId)
        .eq("session_date", todayStr());
      if (sessErr) throw sessErr;

      const mappedSessions = (sessionRows ?? [])
        .map((s) => ({
          id: s.id,
          time: s.session_time,
          childName: s.children?.full_name ?? "—",
          specialistName: profile.Full_name ?? "أخصائي",
          type: s.type ?? "—",
          durationMin: s.duration_minutes,
          status: SESSION_STATUS_MAP[s.status] ?? s.status,
        }))
        .sort((a, b) => parseSessionTimeToMinutes(a.time) - parseSessionTimeToMinutes(b.time));

      // ── 6) التقارير ──────────────────────────────────────────────────
      const { data: reportRows, error: reportsErr } = await supabase
        .from("reports")
        .select("id, content, metrics, created_at, child_id, children(full_name)")
        .eq("specialist_id", specialistId)
        .order("created_at", { ascending: false });
      if (reportsErr) throw reportsErr;

      const mappedReports = (reportRows ?? []).map((r) => {
        const { progressPercent, recommendations } = extractReportMetrics(r.metrics);
        return {
          id: r.id,
          childName: r.children?.full_name ?? "—",
          specialistName: profile.Full_name ?? "أخصائي",
          date: formatDateAr(r.created_at),
          progressPercent,
          summary: r.content ?? "",
          recommendations,
        };
      });

      // ── 7) إحصائيات نظرة عامة ────────────────────────────────────────
      const urgentCases = mappedCases.filter((c) => c.status === "يحتاج متابعة").length;
      const avgProgress =
        mappedCases.length > 0
          ? Math.round(mappedCases.reduce((a, c) => a + c.progressPercent, 0) / mappedCases.length)
          : 0;

      setSpecialization(specialistRow?.specialization ?? null);
      setCases(mappedCases);
      setTodaySessions(mappedSessions);
      setReports(mappedReports);
      setStats({
        activeCases: mappedCases.length,
        todaySessionsCount: mappedSessions.length,
        urgentCases,
        avgProgress,
      });
    } catch (err) {
      console.error("useTawaslDashboardData error:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [profile?.id, profile?.Full_name]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── إنشاء جلسة جديدة ("+ حجز جلسة") ───────────────────────────────────
  const createSession = useCallback(
    async ({ childId, sessionDate, sessionTime, durationMinutes = 45, type, notes }) => {
      if (!profile?.id) throw new Error("مفيش مستخدم مسجّل دخول");

      const { data, error: insertErr } = await supabase
        .from("sessions")
        .insert({
          child_id: childId,
          specialist_id: profile.id,
          session_date: sessionDate,
          session_time: sessionTime,
          duration_minutes: durationMinutes,
          type,
          notes,
          status: "scheduled",
        })
        .select()
        .single();
      if (insertErr) throw insertErr;

      await fetchAll();
      return data;
    },
    [profile?.id, fetchAll]
  );

  // ── تحديث حالة جلسة (قادمة/جارية/منتهية/ملغاة) ────────────────────────
  const updateSessionStatus = useCallback(
    async (sessionId, arabicOrEnglishStatus) => {
      const dbStatus =
        SESSION_STATUS_MAP_REVERSE[arabicOrEnglishStatus] ?? arabicOrEnglishStatus;

      const { error: updateErr } = await supabase
        .from("sessions")
        .update({ status: dbStatus })
        .eq("id", sessionId);
      if (updateErr) throw updateErr;

      await fetchAll();
    },
    [fetchAll]
  );

  return {
    loading: loading || !profile, // لسه مستنيين الـ profile من الـ AuthContext
    error,
    currentUser: {
      id: profile?.id ?? null,
      name: profile?.Full_name ?? "أخصائي",
      title: specialization ?? "أخصائي علاج",
    },
    cases,
    todaySessions,
    reports,
    stats,
    actions: {
      createSession,
      updateSessionStatus,
      refresh: fetchAll,
    },
  };
}
