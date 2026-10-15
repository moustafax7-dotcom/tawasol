// src/pages/NotFound.jsx
import { Link } from "react-router-dom";
import { kidsTokens } from "./theme";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        background: kidsTokens.bg,
        textAlign: "center",
        padding: 24,
      }}
    >
      <h1 style={{ fontFamily: "Cairo, sans-serif", fontSize: 64, color: kidsTokens.primary }}>404</h1>
      <p style={{ color: kidsTokens.textMuted, fontSize: 16 }}>الصفحة اللي بتدور عليها مش موجودة.</p>
      <Link
        to="/"
        style={{
          color: kidsTokens.surface,
          background: kidsTokens.primary,
          padding: "10px 24px",
          borderRadius: 50,
          textDecoration: "none",
          fontWeight: 700,
        }}
      >
        الرجوع للرئيسية
      </Link>
    </div>
  );
}
