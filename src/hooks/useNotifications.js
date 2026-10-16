// src/hooks/useNotifications.js
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { persistReadNotifications } from "../services/notificationService";
import { useAuth } from "../context/AuthContext";

export function useNotifications() {
  const { profile } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    setError(null);
    try {
    const { data, error: queryError } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (queryError) throw queryError;
    setItems(data || []);
    } catch {
      setError("تعذر تحميل الإشعارات. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  // تحديث تلقائي كل 30 ثانية — بديل بسيط لـ Realtime subscription
  useEffect(() => {
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  async function markRead(ids) {
    setError(null);
    try {
      const savedIds = await persistReadNotifications(supabase, profile?.id, ids);
      setItems(previous => previous.map(item => savedIds.includes(item.id) ? { ...item, is_read: true } : item));
      return true;
    } catch {
      setError("تعذر حفظ حالة الإشعارات. حاول مرة أخرى.");
      return false;
    }
  }

  function markAsRead(id) {
    return markRead([id]);
  }

  function markAllRead() {
    return markRead(items.filter(item => !item.is_read).map(item => item.id));
  }

  async function notifySelf({ type, title, message }) {
    if (!profile?.id) return false;
    try {
      const { error: saveError } = await supabase.from("notifications").insert({ user_id: profile.id, type, title, message });
      if (saveError) throw saveError;
      await load();
      return true;
    } catch {
      setError("تعذر حفظ الإشعار. حاول مرة أخرى.");
      return false;
    }
  }

  const unreadCount = items.filter((n) => !n.is_read).length;

  return { items, unreadCount, loading, error, markAsRead, markAllRead, notifySelf, refresh: load };
}
