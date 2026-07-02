import { useState } from "react";
import { supabase } from '../supabaseClient';
// ─────────────────────────────────────────────────────────────
//  DESIGN TOKENS
// ─────────────────────────────────────────────────────────────
const C = {
  primary:      "#2C6E8A",
  primaryDark:  "#1A4D63",
  primaryLight: "#4A90AA",
  accent:       "#E8834A",
  green:        "#4A9B72",
  lavender:     "#8B7BB5",
  bg:           "#F0EDE8",
  white:        "#FFFFFF",
  border:       "#DDD8CF",
  text:         "#1E2535",
  textMid:      "#4A5166",
  textSoft:     "#8890A6",
  error:        "#E05555",
};

// ─────────────────────────────────────────────────────────────
//  GLOBAL STYLES
// ─────────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Tajawal:wght@400;500;700;800&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Tajawal', sans-serif; }

    .auth-input {
      width: 100%; padding: 13px 44px 13px 16px;
      border: 1.5px solid ${C.border}; border-radius: 12px;
      font-size: 15px; font-family: 'Tajawal', sans-serif;
      color: ${C.text}; background: ${C.white};
      outline: none; transition: border-color 0.2s, box-shadow 0.2s;
      direction: rtl;
    }
    .auth-input:focus { border-color: ${C.primary}; box-shadow: 0 0 0 3px ${C.primary}18; }
    .auth-input.err   { border-color: ${C.error};   box-shadow: 0 0 0 3px ${C.error}14; }
    .auth-input::placeholder { color: ${C.textSoft}; }

    .btn-main {
      width: 100%; padding: 14px; background: ${C.primary};
      color: white; border: none; border-radius: 12px;
      font-size: 16px; font-weight: 700; font-family: 'Cairo', sans-serif;
      cursor: pointer; transition: all 0.25s;
      box-shadow: 0 4px 20px ${C.primary}33;
    }
    .btn-main:hover   { background: ${C.primaryDark}; transform: translateY(-1px); }
    .btn-main:disabled{ opacity: 0.6; cursor: not-allowed; transform: none; }

    .role-card {
      border: 2px solid ${C.border}; border-radius: 14px;
      padding: 16px 10px; cursor: pointer;
      transition: all 0.22s; background: ${C.white};
      text-align: center; flex: 1;
    }
    .role-card:hover  { border-color: ${C.primary}; transform: translateY(-2px); }
    .role-card.active { border-color: ${C.primary}; background: ${C.primary}10; box-shadow: 0 4px 14px ${C.primary}22; }

    .tab-btn {
      padding: 10px 0; border: none; border-radius: 10px;
      font-size: 15px; font-weight: 700; font-family: 'Tajawal', sans-serif;
      cursor: pointer; transition: all 0.2s; flex: 1;
    }
    .tab-btn.on  { background: ${C.primary}; color: white; box-shadow: 0 3px 12px ${C.primary}33; }
    .tab-btn.off { background: transparent; color: ${C.textMid}; }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes float {
      0%,100% { transform: translateY(0); }
      50%      { transform: translateY(-10px); }
    }
    .blob { border-radius: 71% 29% 60% 40% / 40% 60% 40% 60%; }

    @media (max-width: 860px) {
      .auth-grid { grid-template-columns: 1fr !important; }
      .auth-left { display: none !important; }
      .auth-right { padding: 36px 28px !important; }
    }
    @media (max-width: 480px) {
      .auth-right { padding: 28px 18px !important; }
    }
  `}</style>
);

// ─────────────────────────────────────────────────────────────
//  REUSABLE INPUT
// ─────────────────────────────────────────────────────────────
function Field({ label, type = "text", placeholder, value, onChange, error, icon }) {
  const [show, setShow] = useState(false);
  const isPass = type === "password";

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        {icon && (
          <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 17 }}>
            {icon}
          </span>
        )}
        <input
          className={`auth-input ${error ? "err" : ""}`}
          type={isPass && show ? "text" : type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
        {isPass && (
          <button type="button" onClick={() => setShow(s => !s)} style={{
            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer", fontSize: 15, color: C.textSoft,
          }}>
            {show ? "🙈" : "👁️"}
          </button>
        )}
      </div>
      {error && <p style={{ fontSize: 12, color: C.error, marginTop: 5 }}>⚠ {error}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  ROLE SELECTOR
// ─────────────────────────────────────────────────────────────
const ROLES = [
  { key: "parent",     emoji: "👩",   label: "ولي الأمر",  desc: "أتابع طفلي"         },
  { key: "specialist", emoji: "👨‍⚕️", label: "أخصائي",     desc: "أدير الحالات"       },
  { key: "child",      emoji: "👶",   label: "طفل",        desc: "ألعب وأتعلم"         },
];

function RoleSelector({ selected, onSelect }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>أنا...</p>
      <div style={{ display: "flex", gap: 10 }}>
        {ROLES.map(({ key, emoji, label, desc }) => (
          <div key={key} className={`role-card ${selected === key ? "active" : ""}`} onClick={() => onSelect(key)}>
            <div style={{ fontSize: 26, marginBottom: 5 }}>{emoji}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: selected === key ? C.primary : C.text, marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 10, color: C.textSoft }}>{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  SUCCESS SCREEN
// ─────────────────────────────────────────────────────────────
function Success({ isLogin }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 0", animation: "fadeUp 0.5s ease" }}>
      <div style={{ fontSize: 60, marginBottom: 16 }}>{isLogin ? "✅" : "🎉"}</div>
      <h3 style={{ fontFamily: "Cairo", fontSize: 22, fontWeight: 800, color: C.green, marginBottom: 8 }}>
        {isLogin ? "تم تسجيل الدخول بنجاح!" : "تم إنشاء الحساب بنجاح!"}
      </h3>
      <p style={{ color: C.textMid, fontSize: 14 }}>
        {isLogin ? "جاري تحويلك للمنصة..." : "مرحباً بك في منصة تواصل 🤝"}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  LOGIN FORM
// ─────────────────────────────────────────────────────────────
function LoginForm({ onSwitch }) {
  const [form, setForm]     = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone]     = useState(false);

  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  function validate() {
    const e = {};
    if (!form.email.trim())                    e.email    = "البريد الإلكتروني مطلوب";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email    = "بريد إلكتروني غير صحيح";
    if (!form.password)                         e.password = "كلمة المرور مطلوبة";
    else if (form.password.length < 6)          e.password = "كلمة المرور أقل من 6 أحرف";
    return e;
  }
async function submit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    
    setLoading(true);
    // الربط الفعلي مع Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (error) {
      setErrors({ email: error.message });
      setLoading(false);
    } else {
      setDone(true);
      setTimeout(() => { window.location.href = "/parent"; }, 1500);
    }
  }


  if (done) return <Success isLogin />;

  return (
    <form onSubmit={submit} style={{ animation: "fadeUp 0.4s ease" }}>
      <Field label="البريد الإلكتروني" type="email" placeholder="example@email.com"
        value={form.email} onChange={set("email")} error={errors.email} icon="📧" />
      <Field label="كلمة المرور" type="password" placeholder="أدخل كلمة المرور"
        value={form.password} onChange={set("password")} error={errors.password} icon="🔒" />

      <div style={{ textAlign: "left", marginBottom: 20, marginTop: -6 }}>
        <span style={{ fontSize: 13, color: C.primary, cursor: "pointer", fontWeight: 600 }}>
          نسيت كلمة المرور؟
        </span>
      </div>

      <button className="btn-main" disabled={loading}>
        {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول ←"}
      </button>

      <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: C.textMid }}>
        ليس لديك حساب؟{" "}
        <span onClick={onSwitch} style={{ color: C.primary, fontWeight: 700, cursor: "pointer" }}>
          إنشاء حساب جديد
        </span>
      </p>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────
//  REGISTER FORM
// ─────────────────────────────────────────────────────────────
function RegisterForm({ onSwitch }) {
  const [role, setRole]     = useState("parent");
  const [form, setForm]     = useState({
    name: "", email: "", password: "", confirm: "",
    childName: "", childAge: "", specialty: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone]     = useState(false);

  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  function validate() {
    const e = {};
    if (!form.name.trim())                     e.name    = "الاسم مطلوب";
    if (!form.email.trim())                    e.email   = "البريد الإلكتروني مطلوب";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email   = "بريد إلكتروني غير صحيح";
    if (!form.password)                         e.password = "كلمة المرور مطلوبة";
    else if (form.password.length < 6)          e.password = "6 أحرف على الأقل";
    if (form.password !== form.confirm)         e.confirm = "كلمة المرور غير متطابقة";
    if (role === "parent") {
      if (!form.childName.trim()) e.childName = "اسم الطفل مطلوب";
      if (!form.childAge)         e.childAge  = "عمر الطفل مطلوب";
    }
    if (role === "specialist" && !form.specialty) e.specialty = "التخصص مطلوب";
    return e;
  }

async function submit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    
    setLoading(true);
    // الربط الفعلي مع Supabase
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.name,
          role: role // تخزين الدور المختار (Parent/Specialist)
        }
      }
    });

    if (error) {
      alert("خطأ: " + error.message);
      setLoading(false);
    } else {
      setDone(true);
      setTimeout(() => {
        const paths = { parent: "/parent", specialist: "/tawasl" };
        window.location.href = paths[role] || "/parent";
      }, 1500);
    }
  }

  if (done) return <Success />;

  return (
    <form onSubmit={submit} style={{ animation: "fadeUp 0.4s ease" }}>
      <RoleSelector selected={role} onSelect={r => { setRole(r); setErrors({}); }} />

      {/* Child — simplified message */}
      {role === "child" ? (
        <div style={{
          background: `${C.green}10`, border: `1px solid ${C.green}30`,
          borderRadius: 14, padding: "20px", textAlign: "center", marginBottom: 20,
        }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🎮</div>
          <p style={{ fontSize: 13, color: C.textMid, lineHeight: 1.8 }}>
            حساب الطفل بيتعمل عن طريق ولي الأمر
            <br />
            اطلب من أمك أو أبوك يسجلوا وهما هيضيفوك!
          </p>
        </div>
      ) : (
        <>
          <Field label="الاسم الكامل" placeholder="أدخل اسمك الكامل"
            value={form.name} onChange={set("name")} error={errors.name} icon="👤" />
          <Field label="البريد الإلكتروني" type="email" placeholder="example@email.com"
            value={form.email} onChange={set("email")} error={errors.email} icon="📧" />
          <Field label="كلمة المرور" type="password" placeholder="6 أحرف على الأقل"
            value={form.password} onChange={set("password")} error={errors.password} icon="🔒" />
          <Field label="تأكيد كلمة المرور" type="password" placeholder="أعد كتابة كلمة المرور"
            value={form.confirm} onChange={set("confirm")} error={errors.confirm} icon="🔒" />

          {/* Parent — child data */}
          {role === "parent" && (
            <div style={{
              background: `${C.primary}08`, border: `1px solid ${C.primary}20`,
              borderRadius: 14, padding: "16px 16px 6px", marginBottom: 16,
            }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.primary, marginBottom: 12 }}>📋 بيانات الطفل</p>
              <Field label="اسم الطفل" placeholder="أدخل اسم طفلك"
                value={form.childName} onChange={set("childName")} error={errors.childName} icon="👶" />
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 6 }}>عمر الطفل</label>
                <select className={`auth-input ${errors.childAge ? "err" : ""}`}
                  value={form.childAge} onChange={e => set("childAge")(e.target.value)} style={{ appearance: "none", paddingRight: 16 }}>
                  <option value="">اختر العمر</option>
                  {Array.from({ length: 15 }, (_, i) => i + 2).map(a => (
                    <option key={a} value={a}>{a} سنوات</option>
                  ))}
                </select>
                {errors.childAge && <p style={{ fontSize: 12, color: C.error, marginTop: 5 }}>⚠ {errors.childAge}</p>}
              </div>
            </div>
          )}

          {/* Specialist — specialty */}
          {role === "specialist" && (
            <div style={{
              background: `${C.lavender}08`, border: `1px solid ${C.lavender}20`,
              borderRadius: 14, padding: "16px 16px 6px", marginBottom: 16,
            }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.lavender, marginBottom: 12 }}>🏥 بيانات التخصص</p>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 6 }}>التخصص</label>
                <select className={`auth-input ${errors.specialty ? "err" : ""}`}
                  value={form.specialty} onChange={e => set("specialty")(e.target.value)} style={{ appearance: "none", paddingRight: 16 }}>
                  <option value="">اختر تخصصك</option>
                  {["أخصائي ABA", "معالج نفسي أطفال", "أخصائي PECS", "معالج سلوكي", "أخصائي تخاطب", "معالج وظيفي"].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {errors.specialty && <p style={{ fontSize: 12, color: C.error, marginTop: 5 }}>⚠ {errors.specialty}</p>}
              </div>
            </div>
          )}

          <button className="btn-main" disabled={loading}>
            {loading ? "جاري إنشاء الحساب..." : "إنشاء الحساب ←"}
          </button>
        </>
      )}

      <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: C.textMid }}>
        لديك حساب؟{" "}
        <span onClick={onSwitch} style={{ color: C.primary, fontWeight: 700, cursor: "pointer" }}>
          تسجيل الدخول
        </span>
      </p>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────
//  LEFT DECORATIVE PANEL
// ─────────────────────────────────────────────────────────────
function LeftPanel() {
  const features = [
    { icon: "🧩", text: "ألعاب علاجية مبنية على ABA" },
    { icon: "📊", text: "تقارير يومية وأسبوعية دقيقة" },
    { icon: "👨‍⚕️", text: "أخصائيون معتمدون في خدمتك" },
    { icon: "🌈", text: "بيئة آمنة وصديقة للحواس" },
  ];

  return (
    <div style={{
      background:     `linear-gradient(160deg, ${C.primaryDark}, ${C.primary} 60%, ${C.lavender})`,
      display:        "flex",
      flexDirection:  "column",
      justifyContent: "center",
      padding:        "56px 44px",
      position:       "relative",
      overflow:       "hidden",
    }}>
      <div className="blob" style={{
        position: "absolute", width: 280, height: 280,
        background: "rgba(255,255,255,0.06)", top: -80, left: -80,
        animation: "float 8s ease-in-out infinite",
      }} />
      <div className="blob" style={{
        position: "absolute", width: 180, height: 180,
        background: "rgba(255,255,255,0.05)", bottom: -50, right: -50,
        animation: "float 10s ease-in-out infinite 2s",
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 44 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 13,
            background: "rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
          }}>🤝</div>
          <span style={{ fontFamily: "Cairo", fontWeight: 900, fontSize: 24, color: "white" }}>تواصل</span>
        </div>

        <h2 style={{
          fontFamily: "Cairo", fontSize: 28, fontWeight: 900,
          color: "white", lineHeight: 1.4, marginBottom: 12,
        }}>
          انضم إلى آلاف الأسر
          <br />التي تثق في تواصل
        </h2>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, lineHeight: 1.8, marginBottom: 36 }}>
          منصة متكاملة تجمع الأطفال بأسرهم والأخصائيين في بيئة آمنة.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 40 }}>
          {features.map(({ icon, text }) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 11,
                background: "rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, flexShrink: 0,
              }}>{icon}</div>
              <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, lineHeight: 1.5 }}>{text}</span>
            </div>
          ))}
        </div>

        <div style={{
          display: "flex", gap: 0,
          background: "rgba(255,255,255,0.12)", borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.2)",
          overflow: "hidden",
        }}>
          {[{ n: "+2000", l: "أسرة" }, { n: "150+", l: "أخصائي" }, { n: "4.9★", l: "تقييم" }].map(({ n, l }, i) => (
            <div key={l} style={{
              textAlign: "center", flex: 1, padding: "16px 10px",
              borderRight: i < 2 ? "1px solid rgba(255,255,255,0.15)" : "none",
            }}>
              <div style={{ fontFamily: "Cairo", fontWeight: 900, fontSize: 20, color: "white" }}>{n}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  ROOT
// ─────────────────────────────────────────────────────────────
export default function Auth() {
  const [mode, setMode] = useState("login");

  return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Tajawal', sans-serif", direction: "rtl", padding: "20px",
    }}>
      <GlobalStyles />

      <div style={{
        width: "100%", maxWidth: 980,
        display: "grid", gridTemplateColumns: "1fr 1fr",
        borderRadius: 24, overflow: "hidden",
        boxShadow: "0 30px 80px rgba(0,0,0,0.14)",
        minHeight: "80vh",
      }} className="auth-grid">

        {/* Left */}
        <div className="auth-left"><LeftPanel /></div>

        {/* Right — Form */}
        <div className="auth-right" style={{
          background: C.white, padding: "48px 40px",
          display: "flex", flexDirection: "column",
          justifyContent: "center", overflowY: "auto",
        }}>
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{
              fontFamily: "Cairo", fontSize: 24, fontWeight: 900,
              color: C.text, marginBottom: 5,
            }}>
              {mode === "login" ? "مرحباً بك مجدداً 👋" : "إنشاء حساب جديد ✨"}
            </h1>
            <p style={{ fontSize: 13, color: C.textMid }}>
              {mode === "login" ? "سجّل دخولك للمتابعة على تواصل" : "انضم إلى منصة تواصل مجاناً"}
            </p>
          </div>

          {/* Mode toggle */}
          <div style={{
            display: "flex", background: C.bg,
            borderRadius: 12, padding: 4, marginBottom: 26, gap: 4,
          }}>
            <button className={`tab-btn ${mode === "login" ? "on" : "off"}`} onClick={() => setMode("login")}>
              تسجيل الدخول
            </button>
            <button className={`tab-btn ${mode === "register" ? "on" : "off"}`} onClick={() => setMode("register")}>
              حساب جديد
            </button>
          </div>

          {/* Form */}
          {mode === "login"
            ? <LoginForm    onSwitch={() => setMode("register")} />
            : <RegisterForm onSwitch={() => setMode("login")}    />
          }

          {/* Back */}
          <div style={{ textAlign: "center", marginTop: 22 }}>
            <a href="/" style={{ fontSize: 12, color: C.textSoft, textDecoration: "none" }}>
              ← العودة للصفحة الرئيسية
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
