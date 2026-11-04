// src/components/RoleSelector.jsx
// ============================================================
// اختيار الدور خطوة أولى في التسجيل. مساحة الطفل مرتبطة بحساب ولي الأمر
// (Disabled by design) — حساب الطفل يُنشأ فقط من داخل حساب
// ولي الأمر بعد تسجيل الدخول، وليس من هنا مباشرة.
// ============================================================
import styles from "./RoleSelector.module.css";

const ROLES = [
  { value: "parent", icon: "👨‍👩‍👧", label: "ولي أمر", desc: "متابعة طفلك وحجز الجلسات" },
  { value: "specialist", icon: "👩‍⚕️", label: "أخصائي", desc: "إدارة خطط علاج وتقارير" },
  { value: "child", icon: "🧒", label: "طفل", desc: "الدخول من خلال ولي الأمر" },
];

export default function RoleSelector({ selectedRole, onSelect }) {
  return (
    <div className={styles.grid} role="radiogroup" aria-label="اختر دورك">
      {ROLES.map((r) => (
        <button
          key={r.value}
          type="button"
          role="radio"
          aria-checked={selectedRole === r.value}
          disabled={r.disabled}
          onClick={() => !r.disabled && onSelect(r.value)}
          className={`${styles.card} ${selectedRole === r.value ? styles.active : ""} ${
            r.disabled ? styles.disabled : ""
          }`}
        >
          <span className={styles.icon}>{r.icon}</span>
          <span className={styles.label}>{r.label}</span>
          <span className={styles.desc}>{r.desc}</span>
        </button>
      ))}
    </div>
  );
}
