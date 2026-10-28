import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { addFamilyChild } from "../services/family";

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
  const request = useRef(0);
  const invalidateRequests = useCallback(() => { ++request.current; }, []);
  const childrenRequest = useRef(0);
  const adding = useRef(false);
  const mounted = useRef(false);
  const [loadedChildId, setLoadedChildId] = useState(null);
  const [childrenRevision, setChildrenRevision] = useState(0);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; invalidateRequests(); };
  }, [invalidateRequests]);
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
      const ticket = ++childrenRequest.current;
      setChildrenLoading(true);
      setError(null);
      try {
        const { data: kids, error } = await supabase
          .from("children")
          .select("*")
          .eq("parent_id", profile.id)
          .order("created_at", { ascending: true });

        if (!isMounted || ticket !== childrenRequest.current) return;
        setChildrenLoading(false);
        if (error) {
          setError("تعذر تحميل قائمة الأطفال. حاول مرة أخرى.");
          return;
        }
        setChildren(kids || []);
        setSelectedChildId(prev => kids?.some(child => child.id === prev) ? prev : kids?.[0]?.id || null);
      } catch {
        if (isMounted && ticket === childrenRequest.current) { setChildrenLoading(false); setError("تعذر تحميل قائمة الأطفال. حاول مرة أخرى."); }
      }
    }

    loadChildren();
    return () => { isMounted = false; };
  }, [profile?.id, childrenRevision]);

  // 2) هات كل بيانات الطفل المختار
  const loadChildData = useCallback(async (childId) => {
    if (!childId) return;
    const ticket = ++request.current;
    setLoading(true);
    setError(null);

    try {
      const today = todayStr();
      const weekAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);

      const [specialistLinkRes, moodTodayRes, weekMoodsRes, tasksRes, sessionsRes] = await Promise.all([
        // Existing link status values still need verification against the hosted schema.
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

      if (!mounted.current || ticket !== request.current) return;
      setLoadedChildId(childId);
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
      if (mounted.current && ticket === request.current) setError(e.message || "حصل خطأ في تحميل البيانات");
    } finally {
      if (mounted.current && ticket === request.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedChildId) return;
    const timer = setTimeout(() => loadChildData(selectedChildId), 0);
    return () => { clearTimeout(timer); invalidateRequests(); };
  }, [selectedChildId, loadChildData, invalidateRequests]);

  const selectedChild = children.find((c) => c.id === selectedChildId) || null;

  function selectChild(childId) {
    if (childId === selectedChildId || !children.some(child => child.id === childId)) return;
    ++request.current;
    setError(null);
    setSelectedChildId(childId);
  }

  async function addChild(values) {
    if (adding.current) return { error: "جاري حفظ بيانات الطفل…" };
    adding.current = true;
    try {
      const result = await addFamilyChild(supabase, profile?.id, values);
      if (!mounted.current) return { error: "تغيّر الحساب أثناء الحفظ. راجع القائمة في الحساب الصحيح." };
      if (result.error) return result;
      ++request.current;
      ++childrenRequest.current;
      setChildrenLoading(false);
      setChildren(prev => [...prev.filter(child => child.id !== result.data.id), result.data]);
      setSelectedChildId(result.data.id);
      setError(null);
      return { error: null };
    } finally {
      adding.current = false;
    }
  }

  return {
    children,
    selectedChild,
    selectedChildId,
    setSelectedChildId: selectChild,
    addChild,
    ...data,
    loading: !error && (loading || loadedChildId !== selectedChildId),
    childrenLoading,
    error,
    refreshChildren: () => setChildrenRevision(value => value + 1),
    refresh: () => selectedChildId && loadChildData(selectedChildId),
  };
}
