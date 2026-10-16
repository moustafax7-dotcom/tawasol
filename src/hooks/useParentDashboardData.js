// src/hooks/useParentDashboardData.js
// ============================================================
// يجيب كل بيانات ParentDashboard من Supabase بدل الـ Mock.
// يدعم أكتر من طفل لكل ولي أمر (Child Switcher).
//
// ⚠️ افتراضات محتاجة تأكيد منك لاحقاً (معلّمة TODO تحت):
//   - specialist_children: بناخد آخر صف (created_at) بغض النظر
//     عن قيمة status، لحد ما تقولّي القيم المحتملة بالظبط
//     (active / accepted / pending..) عشان نفلتر صح.
//   - "التقدم %": مفيش عمود progress جاهز في الـ schema، فبنحسبه
//     مؤقتاً كنسبة مهام النهاردة المخلّصة. لما تجهز metrics في
//     جدول reports هنستبدلها برقم حقيقي من هناك.
// ============================================================
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

const MOOD_MAP = {
  happy: { emoji: "😄", label: "سعيد", color: "#FFD93D", bg: "#FFFBEA" },
  calm: { emoji: "😌", label: "عادي", color: "#6BCB77", bg: "#F0FBF2" },
  sad: { emoji: "😢", label: "حزين", color: "#74B9FF", bg: "#EEF6FF" },
  anxious: { emoji: "😰", label: "قلق", color: "#FFB86B", bg: "#FFF6EA" },
  angry: { emoji: "😡", label: "غاضب", color: "#FF6B6B", bg: "#FFEFEF" },
};
const DEFAULT_MOOD = { emoji: "🙂", label: "لسه ماتسجّلش", color: "#B0B0BC", bg: "#F5F2EE" };

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function useParentDashboardData() {
  const { profile } = useAuth();
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [data, setData] = useState({
    specialist: null,
    moodToday: DEFAULT_MOOD,
    weekMoods: [],
    tasksToday: [],
    gamesToday: [],
    streak: 0,
    progress: 0,
  });
  const [loading, setLoading] = useState(true);
  const [childrenLoading, setChildrenLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1) هات كل أطفال ولي الأمر
  useEffect(() => {
    if (!profile?.id) return;
    let isMounted = true;

    async function loadChildren() {
      setChildrenLoading(true);
      const { data: kids, error } = await supabase
        .from("children")
        .select("*")
        .eq("parent_id", profile.id)
        .order("created_at", { ascending: true });

      if (!isMounted) return;
      setChildrenLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      setChildren(kids || []);
      if (kids && kids.length > 0) setSelectedChildId((prev) => prev ?? kids[0].id);
    }

    loadChildren();
    return () => { isMounted = false; };
  }, [profile?.id]);

  // 2) هات كل بيانات الطفل المختار
  const loadChildData = useCallback(async (childId) => {
    if (!childId) return;
    setLoading(true);
    setError(null);

    try {
      const today = todayStr();
      const weekAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);

      const [specialistLinkRes, moodTodayRes, weekMoodsRes, tasksRes, sessionsRes] = await Promise.all([
        // TODO: فلتر status لما تأكدلي القيم المحتملة
        supabase.from("specialist_children").select("specialist_id").eq("child_id", childId).order("created_at", { ascending: false }).limit(1),
        supabase.from("mood_logs").select("*").eq("child_id", childId).gte("logged_at", `${today}T00:00:00`).order("logged_at", { ascending: false }).limit(1),
        supabase.from("mood_logs").select("*").eq("child_id", childId).gte("logged_at", `${weekAgo}T00:00:00`).order("logged_at", { ascending: true }),
        supabase.from("daily_tasks").select("*").eq("child_id", childId).eq("task_date", today),
        supabase.from("game_sessions").select("*, games(title, category)").eq("child_id", childId).gte("played_at", `${today}T00:00:00`).order("played_at", { ascending: false }),
      ]);

      for (const result of [specialistLinkRes, moodTodayRes, weekMoodsRes, tasksRes, sessionsRes]) {
        if (result.error) throw new Error("تعذر تحميل بيانات المتابعة. حاول مرة أخرى.");
      }

      // الأخصائي المتابع
      let specialist = null;
      const specId = specialistLinkRes.data?.[0]?.specialist_id;
      if (specId) {
        const [{ data: sp }, { data: prof }] = await Promise.all([
          supabase.from("specialists").select("*").eq("id", specId).single(),
          supabase.from("profiles").select("Full_name, phone").eq("id", specId).single(),
        ]);
        specialist = {
          name: prof?.Full_name || "أخصائي",
          title: sp?.specialization || "",
          rating: null, // مفيش تقييمات مخزّنة حالياً
        };
      }

      // مزاج اليوم
      const moodRow = moodTodayRes.data?.[0];
      const moodToday = moodRow ? { ...(MOOD_MAP[moodRow.mood] || DEFAULT_MOOD) } : DEFAULT_MOOD;

      // مزاج الأسبوع (نظمها بترتيب الأيام، فراغات لو مفيش تسجيل)
      const weekMoods = (weekMoodsRes.data || []).map((m) => ({
        day: new Date(m.logged_at).toLocaleDateString("ar-EG", { weekday: "short" }),
        emoji: (MOOD_MAP[m.mood] || DEFAULT_MOOD).emoji,
        color: (MOOD_MAP[m.mood] || DEFAULT_MOOD).color,
      }));

      // مهام اليوم + الستريك (آخر 14 يوم فيهم مهمة واحدة خالص متعملة)
      const tasksToday = tasksRes.data || [];
      const doneCount = tasksToday.filter((t) => t.done).length;
      const progress = tasksToday.length > 0 ? Math.round((doneCount / tasksToday.length) * 100) : 0;

      const { data: last14, error: historyError } = await supabase
        .from("daily_tasks")
        .select("task_date, done")
        .eq("child_id", childId)
        .gte("task_date", new Date(Date.now() - 13 * 86400000).toISOString().slice(0, 10))
        .order("task_date", { ascending: false });

      if (historyError) throw new Error("تعذر تحميل سجل المهام.");
      let streak = 0;
      if (last14?.length) {
        const byDate = {};
        last14.forEach((t) => { byDate[t.task_date] = byDate[t.task_date] || t.done; });
        for (let i = 0; i < 14; i++) {
          const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
          if (byDate[d]) streak++; else break;
        }
      }

      setData({
        specialist,
        moodToday,
        weekMoods,
        tasksToday,
        gamesToday: sessionsRes.data || [],
        streak,
        progress,
      });
    } catch (e) {
      setError(e.message || "حصل خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedChildId) return;
    const timer = setTimeout(() => loadChildData(selectedChildId), 0);
    return () => clearTimeout(timer);
  }, [selectedChildId, loadChildData]);

  const selectedChild = children.find((c) => c.id === selectedChildId) || null;

  // إضافة طفل جديد لولي الأمر الحالي (بيشتغل هنا لأن المستخدم
  // فعلياً عامل Session وقت ما بيبقى جوه الداشبورد، فالـ RLS
  // العادي (parent_id = auth.uid()) هيسمح بيه من غير مشاكل)
  async function addChild({ fullName, age }) {
    if (!profile?.id) return { error: "لسه بيانات المستخدم بتتحمّل" };
    const { data: newChild, error } = await supabase
      .from("children")
      .insert({ parent_id: profile.id, full_name: fullName, age: age || null })
      .select()
      .single();

    if (error) return { error: error.message };

    setChildren((prev) => [...prev, newChild]);
    setSelectedChildId(newChild.id);
    return { error: null };
  }

  return {
    children,
    selectedChild,
    selectedChildId,
    setSelectedChildId,
    addChild,
    ...data,
    loading,
    childrenLoading,
    error,
    refresh: () => selectedChildId && loadChildData(selectedChildId),
  };
}
