// src/components/NotificationBell.jsx
// ============================================================
// جرس إشعارات جاهز — يكفي تحطه <NotificationBell /> في أي
// داشبورد من غير أي props، بيجيب بياناته لوحده من useNotifications.
// ============================================================
import { useState, useRef, useEffect } from "react";
import { useNotifications } from "../hooks/useNotifications";

const TYPE_ICON = {
  new_report: "📊",
  new_session: "📅",
  tasks_done: "🎉",
};

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  return `منذ ${Math.floor(hours / 24)} يوم`;
}

export default function NotificationBell({ color = "#2C6E8A" }) {
  const { items, unreadCount, markAsRead, markAllRead, loading, error, refresh } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const toggleRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} onKeyDown={(event) => { if (event.key === "Escape") { setOpen(false); toggleRef.current?.focus(); } }} style={{ position: "relative", fontFamily: "inherit" }}>
      <button
        ref={toggleRef}
        onClick={() => setOpen((o) => !o)}
        aria-label="الإشعارات"
        aria-expanded={open}
        onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}
        style={{
          position: "relative", width: 40, height: 40, borderRadius: "50%",
          border: "none", background: "rgba(0,0,0,0.05)", cursor: "pointer",
          fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: 2, left: 2, minWidth: 16, height: 16,
            borderRadius: 999, background: "#E05555", color: "#fff",
            fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center",
            justifyContent: "center", padding: "0 3px",
          }}>{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: 48, left: 0, width: "min(320px, calc(100vw - 32px))", maxHeight: 400,
          overflowY: "auto", background: "#fff", borderRadius: 16,
          boxShadow: "0 12px 32px rgba(0,0,0,0.15)", border: "1px solid #EAE6DE",
          zIndex: 200, direction: "rtl",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid #EAE6DE" }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#1E2535" }}>الإشعارات</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{ background: "none", border: "none", fontSize: 12, color, cursor: "pointer", fontWeight: 700 }}>
                تعليم الكل كمقروء
              </button>
            )}
          </div>

          {error ? <div role="alert" style={{ padding: 16, color: "#9B3030" }}>{error} <button onClick={refresh}>إعادة المحاولة</button></div> : loading ? <div role="status" style={{ padding: 16 }}>جاري التحميل...</div> : items.length === 0 ? (
            <div style={{ padding: "30px 16px", textAlign: "center", color: "#8890A6", fontSize: 13 }}>
              مفيش إشعارات لسه
            </div>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                onClick={() => markAsRead(n.id)}
                style={{
                  display: "flex", gap: 10, width: "100%", textAlign: "right",
                  padding: "12px 16px", border: "none", borderBottom: "1px solid #F3F1EC",
                  background: n.is_read ? "#fff" : "#F0F6F9", cursor: "pointer", fontFamily: "inherit",
                }}
              >
                <span style={{ fontSize: 20, flexShrink: 0 }}>{TYPE_ICON[n.type] || "🔔"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: n.is_read ? 600 : 800, color: "#1E2535" }}>{n.title}</div>
                  {n.message && <div style={{ fontSize: 12, color: "#8890A6", marginTop: 2 }}>{n.message}</div>}
                  <div style={{ fontSize: 10, color: "#B0B0BC", marginTop: 4 }}>{timeAgo(n.created_at)}</div>
                </div>
                {!n.is_read && <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0, marginTop: 4 }} />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
