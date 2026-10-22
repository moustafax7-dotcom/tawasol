// src/pages/Auth/Auth.jsx
// ============================================================
// صفحة واحدة بتبدّل بين Login و Register (Tab-based) بدل
// صفحتين منفصلتين، لتقليل تكرار الـ Layout والـ Google Button.
//
// ⚠️ إصلاح: تمت إزالة استدعاء `login()` من useAuth() لأنها
// دالة غير موجودة في AuthContext (اللي بيصدّر بس profile/loading/
// logout). AuthContext بيكتشف تسجيل الدخول تلقائياً عن طريق
// supabase.auth.onAuthStateChange، فمش محتاجين ننادي حاجة يدوي.
// ============================================================
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import InputField from "../components/InputField";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";
import RoleSelector from "../components/RoleSelector";
import {
  loginWithEmail,
  registerUser,
  loginWithGoogle,
  getAuthErrorMessage,
  SPECIALTIES,
} from "../services/authService";
import styles from "./Auth.module.css";

import { getAuthDestination } from "../services/authPolicy";

export default function Auth() {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [role, setRole] = useState("parent");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    childName: "",
    childAge: "",
    specialty: SPECIALTIES[0].value,
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [infoMessage, setInfoMessage] = useState(""); // رسائل نجاح غير حرجة (زي "أكّد إيميلك")

  const navigate = useNavigate();
  const location = useLocation();

  const updateField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function validate() {
    const next = {};
    if (!form.email) next.email = "البريد الإلكتروني مطلوب.";
    if (!form.password) next.password = "كلمة المرور مطلوبة.";
    if (mode === "register") {
      if (!form.name) next.name = "الاسم مطلوب.";
      if (form.password !== form.confirmPassword) next.confirmPassword = "كلمتا المرور غير متطابقتين.";
      if (role === "parent" && !form.childName) next.childName = "اسم الطفل مطلوب.";
      if (role === "parent" && !form.childAge) next.childAge = "عمر الطفل مطلوب.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function redirectAfterAuth(user) {
    const from = location.state?.from?.pathname;
    navigate(getAuthDestination(user.role, from), { replace: true });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    setInfoMessage("");
    if (role === "child") {
      setFormError("يجب إنشاء حساب الطفل من خلال ولي الأمر.");
      return;
    }
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (mode === "login") {
        const user = await loginWithEmail(form.email, form.password);
        // ملحوظة: مش محتاجين ننادي حاجة يدوي هنا — AuthContext
        // هيكتشف الجلسة تلقائياً. إحنا بس بنوجّه المستخدم للصفحة الصح.
        redirectAfterAuth(user);
      } else {
        const extra =
          role === "parent"
            ? { childName: form.childName, childAge: Number(form.childAge) }
            : { specialty: form.specialty };
        const user = await registerUser({ name: form.name, email: form.email, password: form.password, role, extra });

        if (user.needsEmailConfirmation) {
          // مفيش Session لسه — الحساب اتعمل لكن لازم تأكيد إيميل الأول
          setInfoMessage("تم إنشاء حسابك! برجاء تأكيد بريدك الإلكتروني من الرابط اللي وصلك، وبعدين سجّل دخولك.");
          setMode("login");
        } else {
          redirectAfterAuth(user);
        }
      }
    } catch (err) {
      setFormError(getAuthErrorMessage(err.code));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    setSubmitting(true);
    setFormError("");
    try {
      await loginWithGoogle();
      // signInWithOAuth بيعمل Redirect فعلي للمتصفح، فمفيش داعي
      // لأي navigate يدوي هنا — الصفحة هتتغير لوحدها.
    } catch (err) {
      setFormError(getAuthErrorMessage(err.code));
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <img src="/logo.jpg" alt="تواصل" className={styles.logo} style={{ width: 40, height: 40, objectFit: "contain" }} />
          <span className={styles.brandName}>تواصل</span>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${mode === "login" ? styles.tabActive : ""}`}
            onClick={() => { setMode("login"); setFormError(""); setInfoMessage(""); }}
            type="button"
          >
            تسجيل الدخول
          </button>
          <button
            className={`${styles.tab} ${mode === "register" ? styles.tabActive : ""}`}
            onClick={() => { setMode("register"); setFormError(""); setInfoMessage(""); }}
            type="button"
          >
            حساب جديد
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {mode === "register" && (
            <>
              <RoleSelector selectedRole={role} onSelect={setRole} />
              {role === "child" && (
                <p className={styles.childNotice}>يجب إنشاء حساب الطفل من خلال ولي الأمر.</p>
              )}
              {role !== "child" && (
                <InputField
                  label="الاسم بالكامل"
                  value={form.name}
                  onChange={updateField("name")}
                  error={errors.name}
                  autoComplete="name"
                />
              )}
            </>
          )}

          {role !== "child" && (
            <>
              <InputField
                label="البريد الإلكتروني"
                type="email"
                value={form.email}
                onChange={updateField("email")}
                error={errors.email}
                autoComplete="email"
              />
              <InputField
                label="كلمة المرور"
                type="password"
                value={form.password}
                onChange={updateField("password")}
                error={errors.password}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              {mode === "register" && <PasswordStrengthMeter password={form.password} />}

              {mode === "register" && (
                <InputField
                  label="تأكيد كلمة المرور"
                  type="password"
                  value={form.confirmPassword}
                  onChange={updateField("confirmPassword")}
                  error={errors.confirmPassword}
                  autoComplete="new-password"
                />
              )}

              {mode === "register" && role === "parent" && (
                <div className={styles.row}>
                  <InputField
                    label="اسم الطفل"
                    value={form.childName}
                    onChange={updateField("childName")}
                    error={errors.childName}
                  />
                  <InputField
                    label="عمر الطفل"
                    type="number"
                    value={form.childAge}
                    onChange={updateField("childAge")}
                    error={errors.childAge}
                  />
                </div>
              )}

              {mode === "register" && role === "specialist" && (
                <div className={styles.field}>
                  <label className={styles.label}>التخصص</label>
                  <select
                    className={styles.select}
                    value={form.specialty}
                    onChange={updateField("specialty")}
                  >
                    {SPECIALTIES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {mode === "login" && (
                <div className={styles.metaRow}>
                  <label className={styles.remember}>
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                    تذكرني
                  </label>
                  <button type="button" className={styles.linkBtn} onClick={() => navigate("/auth/forgot-password")}>
                    نسيت كلمة المرور؟
                  </button>
                </div>
              )}
            </>
          )}

          {infoMessage && (
            <p className={styles.formError} role="status" style={{ color: "#2E7D32", background: "#EAF7EE" }}>
              {infoMessage}
            </p>
          )}

          {formError && (
            <p className={styles.formError} role="alert">
              {formError}
            </p>
          )}

          {role !== "child" && (
            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? "جاري التحميل..." : mode === "login" ? "دخول" : "إنشاء الحساب"}
            </button>
          )}
        </form>

        {role !== "child" && (
          <>
            <div className={styles.divider}>
              <span>أو</span>
            </div>
            <button type="button" className={styles.googleBtn} onClick={handleGoogleLogin} disabled={submitting}>
              <span>🔵</span> المتابعة عبر جوجل
            </button>
          </>
        )}
      </div>
    </div>
  );
}
