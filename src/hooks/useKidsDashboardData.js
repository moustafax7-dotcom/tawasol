// src/hooks/useKidsDashboardData.js
// ============================================================
// يجيب بيانات لوحة الطفل من Supabase: أطفال ولي الأمر، مهام
// النهاردة (مع إنشاء تلقائي لو مفيش)، النقاط (rewards)، وربط
// الألعاب بجدول games عشان تسجيل النتائج.
//
// ⚠️ نطاق النسخة دي (Scope): بس "مهام النهاردة" متصلة فعلياً
// بقاعدة البيانات. أيام الأسبوع التانية (قبل/بعد النهاردة) هتفضل
// عرض محلي بسيط لحد ما نوسّع الميزة دي — علّمتها TODO تحت.
// ============================================================
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

// المهام الافتراضية لأي يوم جديد — نفس النص المصحح من طلبك
// (صيغة مفرد متكلم، وإضافة الوضوء اللي كان ناقص)
const DEFAULT_TASKS = [
  { task_key: "pray",  emoji: "🕌", label: "صليت" },
  { task_key: "wudu",  emoji: "🤲", label: "توضّيت" },
  { task_key: "teeth", emoji: "🦷", label: "غسلت أسناني" },
  { task_key: "game",  emoji: "🎮", label: "لعبت ألعاب" },
  { task_key: "hw",    emoji: "📚", label: "عملت واجبي" },
  { task_key: "read",  emoji: "📖", label: "قريت كتاب" },
  { task_key: "eat",   emoji: "🥗", label: "اكلت أكل صحي" },
];

// خريطة الألعاب المحلية (زي ما هي مستخدمة في الواجهة) لمفاتيح
// جدول games الحقيقي — لازم تتطابق مع seed_games.sql
const GAME_KEY_MAP = {
  memory: "memory",
  animals: "animal_sounds",
  puzzle: "sequencing",
  colors: "color_match",
  draw: "tracing",
  music: "music",
  prayer: "prayer",
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function useKidsDashboardData() {
  const { profile } = useAuth();
  const [children, setChildren] = useState([]);
  const [childrenLoading, setChildrenLoading] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState(null);

  const [tasksToday, setTasksToday] = useState([]);
  const [points, setPoints] = useState(0);
  const [gamesMap, setGamesMap] = useState({}); // game_key -> real game id
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1) هات كل أطفال ولي الأمر
  useEffect(() => {
    if (!profile?.id) return;
    let isMounted = true;
    (async () => {
      setChildrenLoading(true);
      const { data, error } = await supabase
        .from("children")
        .select("*")
        .eq("parent_id", profile.id)
        .order("created_at", { ascending: true });
      if (!isMounted) return;
      setChildrenLoading(false);
      if (error) { setError(error.message); return; }
      setChildren(data || []);
      if (data?.length === 1) setSelectedChildId(data[0].id);
    })();
    return () => { isMounted = false; };
  }, [profile?.id]);

  // 2) هات خريطة الألعاب مرة واحدة بس
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("games").select("id, game_key");
      if (data) {
        const map = {};
        data.forEach((g) => { if (g.game_key) map[g.game_key] = g.id; });
        setGamesMap(map);
      }
    })();
  }, []);

  // 3) هات (أو أنشئ) مهام النهاردة + النقاط لما يتحدد طفل
  const loadChildData = useCallback(async (childId) => {
    if (!childId) return;
    setLoading(true);
    setError(null);
    try {
      const today = todayStr();

      let { data: tasks } = await supabase
        .from("daily_tasks")
        .select("*")
        .eq("child_id", childId)
        .eq("task_date", today);

      if (!tasks || tasks.length === 0) {
        const rows = DEFAULT_TASKS.map((t) => ({
          child_id: childId,
          task_date: today,
          task_key: t.task_key,
          emoji: t.emoji,
          label: t.label,
          done: false,
        }));
        const { data: inserted, error: insertErr } = await supabase
          .from("daily_tasks")
          .insert(rows)
          .select();
        if (insertErr) throw insertErr;
        tasks = inserted;
      }
      setTasksToday(tasks || []);

      // النقاط (rewards) — أنشئ صف لو مش موجود
      let { data: reward } = await supabase
        .from("rewards")
        .select("*")
        .eq("child_id", childId)
        .maybeSingle();

      if (!reward) {
        const { data: newReward } = await supabase
          .from("rewards")
          .insert({ child_id: childId, coins: 0 })
          .select()
          .single();
        reward = newReward;
      }
      setPoints(reward?.coins ?? 0);
    } catch (e) {
      setError(e.message || "حصل خطأ في تحميل بيانات الطفل");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedChildId) loadChildData(selectedChildId);
  }, [selectedChildId, loadChildData]);

  // تبديل حالة مهمة (خلصت / لسه)
  async function toggleTask(taskId) {
    const task = tasksToday.find((t) => t.id === taskId);
    if (!task) return;
    const newDone = !task.done;

    // تحديث فوري في الواجهة (Optimistic)
    setTasksToday((prev) => prev.map((t) => (t.id === taskId ? { ...t, done: newDone } : t)));

    const { error } = await supabase.from("daily_tasks").update({ done: newDone }).eq("id", taskId);
    if (error) {
      // رجّع الحالة القديمة لو فشل التحديث
      setTasksToday((prev) => prev.map((t) => (t.id === taskId ? { ...t, done: !newDone } : t)));
    }
  }

  // إضافة نقاط بعد لعبة + تسجيل الجلسة في game_sessions
  async function addGameReward({ localGameId, score, level, durationSeconds = 0, coinsEarned }) {
    if (!selectedChildId) return;

    // تحديث النقاط محلياً فوراً + في قاعدة البيانات
    const newTotal = points + coinsEarned;
    setPoints(newTotal);
    await supabase.from("rewards").update({ coins: newTotal, updated_at: new Date().toISOString() }).eq("child_id", selectedChildId);

    // تسجيل جلسة اللعب (لو لقينا الـ game الحقيقي في الخريطة)
    const realGameId = gamesMap[GAME_KEY_MAP[localGameId]];
    if (realGameId) {
      await supabase.from("game_sessions").insert({
        child_id: selectedChildId,
        game_id: realGameId,
        score,
        duration_seconds: durationSeconds,
        played_at: new Date().toISOString(),
        raw_data: { level },
      });
    }
  }

  const selectedChild = children.find((c) => c.id === selectedChildId) || null;

  return {
    children,
    childrenLoading,
    selectedChild,
    selectedChildId,
    setSelectedChildId,
    tasksToday,
    toggleTask,
    points,
    addGameReward,
    loading,
    error,
  };
}
