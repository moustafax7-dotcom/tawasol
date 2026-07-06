// src/pages/theme.js
// ============================================================
// Tawasol Design System — Shared Tokens for Dashboards & Games
// ------------------------------------------------------------
// هذا الملف مبني بناءً على استخراج كل استخدامات K./T. الفعلية
// من الملفات التالية (grep دقيق، مش تخمين):
//   - kidsDashboard.tsx     → kidsTokens
//   - Tawasol_Dashboard.tsk → specialistTokens
//   - Memory_game.tsk       → memoryTokens
//
// القيم مأخوذة من كائن "T" المحلي الموجود فعلاً بالفعل داخل
// parent_Dashboard.tsx و Memory_Game_Full.tsx (نفس التصميم
// "الدافئ" المستخدم في كل شاشات المتابعة)، لضمان اتساق بصري
// كامل بين الأهل/الطفل/الأخصائي. أي قيمة لم تكن موجودة فعلياً
// (كـ warning/danger/sidebar) تم اختيارها متوافقة مع نفس النظام.
//
// ⚠️ إذا كان لديك ملف theme.js أصلي مختلف من الفريق، أرسله
// واستبدل هذا الملف بالقيم الحقيقية.
// ============================================================

// ─── Kids Zone (تُستخدم في KidsDashboard.tsx) ─────────────────
export const kidsTokens = {
  primary: "#E9824C",
  secondary: "#8E80BC",
  bg: "#F5F2EE",
  surface: "#FFFFFF",
  text: "#2C2C3A",
  textMuted: "#8A8A9A",
  border: "#EAE6DE",
  shadow: "rgba(44,44,58,0.07)",
};

// ─── Memory Game (تُستخدم في MemoryGame.tsx) ──────────────────
export const memoryTokens = {
  primary: "#E9824C",
  primaryLight: "#F5A47C",
  primaryBg: "#FEF0E8",
  secondary: "#8E80BC",
  secondaryBg: "#F0EEF8",
  bg: "#F5F3EE",
  surface: "#FFFFFF",
  text: "#2C2C3A",
  textMuted: "#8A8A9A",
  border: "#E8E4DC",
  success: "#5BB88A",
  successBg: "#EAF7F1",
  shadow: "rgba(44,44,58,0.08)",
  shadowMd: "rgba(44,44,58,0.13)",
};

// ─── Specialist Dashboard (تُستخدم في TawaslDashboard.tsx) ────
export const specialistTokens = {
  primary: "#E9824C",
  primaryBg: "#FEF0E8",
  secondary: "#8E80BC",
  secondaryBg: "#F0EEF8",
  success: "#5BB88A",
  successBg: "#EAF7F1",
  warning: "#E9A23B",
  danger: "#E76F6F",
  dangerBg: "#FBECEC",
  bg: "#F5F2EE",
  surface: "#FFFFFF",
  surfaceAlt: "#FAF8F5",
  sidebar: "#2C2C3A",
  sidebarActive: "#3A3A4C",
  text: "#2C2C3A",
  textMuted: "#8A8A9A",
  textLight: "#B0B0BC",
  border: "#EAE6DE",
  shadow: "rgba(44,44,58,0.07)",
};

export default { kidsTokens, memoryTokens, specialistTokens };
