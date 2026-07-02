import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────
//  DESIGN TOKENS
// ─────────────────────────────────────────────────────────────
const C = {
  // Core palette
  primary:      "#2C6E8A",
  primaryDark:  "#1A4D63",
  primaryLight: "#4A90AA",
  accent:       "#E8834A",
  accentLight:  "#F4B088",
  green:        "#4A9B72",
  greenLight:   "#7DC4A0",
  lavender:     "#8B7BB5",
  lavLight:     "#B8AED4",
  teal:         "#3AAFA9",

  // Neutrals
  bg:       "#F0EDE8",
  bgWarm:   "#EAE5DD",
  card:     "#FAFAF7",
  white:    "#FFFFFF",
  border:   "#DDD8CF",

  // Text
  text:     "#1E2535",
  textMid:  "#4A5166",
  textSoft: "#8890A6",
};

// ─────────────────────────────────────────────────────────────
//  GLOBAL STYLES
// ─────────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Tajawal:wght@400;500;700;800&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { font-family: 'Tajawal', sans-serif; }

    .nav-link {
      color: ${C.textMid};
      text-decoration: none;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: color 0.2s;
      font-family: 'Tajawal', sans-serif;
    }
    .nav-link:hover { color: ${C.primary}; }

    .btn-primary {
      background: ${C.primary};
      color: white;
      border: none;
      padding: 14px 32px;
      border-radius: 50px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      font-family: 'Cairo', sans-serif;
      box-shadow: 0 4px 20px ${C.primary}44;
      transition: all 0.25s;
    }
    .btn-primary:hover {
      background: ${C.primaryDark};
      transform: translateY(-2px);
      box-shadow: 0 8px 28px ${C.primary}55;
    }

    .btn-outline {
      background: transparent;
      color: ${C.primary};
      border: 2px solid ${C.primary};
      padding: 12px 28px;
      border-radius: 50px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      font-family: 'Cairo', sans-serif;
      transition: all 0.25s;
    }
    .btn-outline:hover { background: ${C.primary}; color: white; }

    .feature-card {
      background: ${C.white};
      border-radius: 20px;
      border: 1px solid ${C.border};
      transition: transform 0.25s, box-shadow 0.25s;
    }
    .feature-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 20px 50px rgba(0,0,0,0.10);
    }

    .tab-btn {
      padding: 11px 26px;
      border-radius: 50px;
      font-weight: 700;
      font-size: 15px;
      cursor: pointer;
      border: 1px solid ${C.border};
      transition: all 0.25s;
      font-family: 'Tajawal', sans-serif;
      background: ${C.card};
      color: ${C.textMid};
    }
    .tab-btn.active {
      background: ${C.primary};
      color: white;
      border-color: ${C.primary};
      box-shadow: 0 4px 16px ${C.primary}44;
    }

    .specialist-card {
      background: ${C.white};
      border-radius: 22px;
      border: 1px solid ${C.border};
      transition: transform 0.25s, box-shadow 0.25s;
    }
    .specialist-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 20px 50px rgba(0,0,0,0.10);
    }

    .testimonial-card {
      background: ${C.white};
      border-radius: 20px;
      border: 1px solid ${C.border};
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50%       { transform: translateY(-14px); }
    }
    @keyframes floatSlow {
      0%, 100% { transform: translateY(0px); }
      50%       { transform: translateY(-8px); }
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(30px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.95); }
      to   { opacity: 1; transform: scale(1); }
    }

    .blob {
      border-radius: 71% 29% 60% 40% / 40% 60% 40% 60%;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .hero-grid   { grid-template-columns: 1fr !important; }
      .stats-grid  { grid-template-columns: repeat(2,1fr) !important; }
      .feat-grid   { grid-template-columns: 1fr !important; }
      .spec-grid   { grid-template-columns: repeat(2,1fr) !important; }
      .test-grid   { grid-template-columns: 1fr !important; }
      .steps-grid  { grid-template-columns: 1fr !important; }
      .footer-grid { grid-template-columns: 1fr !important; }
      .nav-links   { display: none !important; }
      .hero-card   { display: none !important; }
    }
    @media (max-width: 480px) {
      .stats-grid { grid-template-columns: 1fr !important; }
      .spec-grid  { grid-template-columns: 1fr !important; }
    }
  `}</style>
);

// ─────────────────────────────────────────────────────────────
//  CUSTOM HOOK — Intersection Observer
// ─────────────────────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, inView];
}

// ─────────────────────────────────────────────────────────────
//  ANIMATED WRAPPER
// ─────────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, style = {} }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      style={{
        opacity:    inView ? 1 : 0,
        transform:  inView ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  SECTION LABEL
// ─────────────────────────────────────────────────────────────
function SectionLabel({ text, color = C.accent }) {
  return (
    <p style={{
      fontSize: 12, fontWeight: 700, color,
      letterSpacing: 2, textTransform: "uppercase",
      marginBottom: 12,
    }}>
      {text}
    </p>
  );
}

// ─────────────────────────────────────────────────────────────
//  NAVBAR
// ─────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav style={{
      position:       "fixed",
      top:            0,
      right:          0,
      left:           0,
      zIndex:         100,
      height:         70,
      padding:        "0 2%",
      display:        "flex",
      alignItems:     "center",
      justifyContent: "space-between",
      background:     scrolled ? "rgba(240,237,232,0.96)" : "transparent",
      backdropFilter: scrolled ? "blur(20px)" : "none",
      borderBottom:   scrolled ? `1px solid ${C.border}` : "none",
      transition:     "all 0.35s",
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width:        42,
          height:       42,
          borderRadius: 13,
          background:   `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
          display:      "flex",
          alignItems:   "center",
          justifyContent: "center",
          fontSize:     20,
          boxShadow:    `0 4px 14px ${C.primary}44`,
        }}>
          🤝
        </div>
        <span style={{
          fontFamily: "Cairo, sans-serif",
          fontWeight: 900,
          fontSize:   22,
          color:      C.primary,
        }}>
          تواصل
        </span>
      </div>

      {/* Links */}
      <div className="nav-links" style={{ display: "flex", gap: 36, alignItems: "center" }}>
        {["الرئيسية", "من نحن", "الأقسام", "الأخصائيون"].map(link => (
          <a key={link} className="nav-link">{link}</a>
        ))}
        <button className="btn-primary" style={{ padding: "10px 24px", fontSize: 14 }}>
        ابدأ سجل
        </button>
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────
//  HERO SECTION
// ─────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section style={{
      minHeight:  "100vh",
      background: `linear-gradient(160deg, #E8F3F8 0%, ${C.bg} 55%, #EDE8F3 100%)`,
      display:    "flex",
      alignItems: "center",
      padding:    "110px 2% 70px",
      position:   "relative",
      overflow:   "hidden",
    }}>
      {/* Background blobs */}
      <div className="blob" style={{
        position:   "absolute", width: 520, height: 520,
        background: `${C.primaryLight}16`, top: -120, left: -160,
        animation:  "float 9s ease-in-out infinite",
      }} />
      <div className="blob" style={{
        position:   "absolute", width: 380, height: 380,
        background: `${C.accent}12`, bottom: -100, right: -120,
        animation:  "float 11s ease-in-out infinite 2s",
      }} />
      <div className="blob" style={{
        position:   "absolute", width: 240, height: 240,
        background: `${C.lavender}14`, top: "40%", left: "40%",
        animation:  "float 13s ease-in-out infinite 1s",
      }} />

      <div style={{
      
        width:               "100%",
        display:             "grid",
        gridTemplateColumns: "1fr 1fr",
        gap:                 60,
        alignItems:          "center",
        position:            "relative",
        zIndex:              1,
      }} className="hero-grid">

        {/* Left — Text */}
        <div style={{ animation: "fadeUp 0.8s ease both" }}>
          {/* Badge */}
          <div style={{
            display:      "inline-flex",
            alignItems:   "center",
            gap:          8,
            background:   `${C.green}14`,
            border:       `1px solid ${C.green}30`,
            borderRadius: 50,
            padding:      "7px 18px",
            marginBottom: 28,
            color:        C.green,
            fontSize:     13,
            fontWeight:   700,
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: C.green, display: "inline-block",
            }} />
            منصة رائدة لدعم أطفال التوحد في مصر
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily:  "Cairo, sans-serif",
            fontSize:    "clamp(38px, 4.5vw, 60px)",
            fontWeight:  900,
            lineHeight:  1.2,
            marginBottom: 22,
            color:       C.text,
          }}>
            معاً نبني
            <br />
            <span style={{
              background:           `linear-gradient(135deg, ${C.primary}, ${C.lavender})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor:  "transparent",
            }}>
              جسر التواصل
            </span>
            <br />
            مع طفلك
          </h1>

          {/* Description */}
          <p style={{
            fontSize:     17,
            lineHeight:   1.9,
            color:        C.textMid,
            marginBottom: 38,
            maxWidth:     500,
          }}>
            منصة تفاعلية متكاملة تدعم أطفال التوحد وذوي الاحتياجات الخاصة — تجمع الأطفال بأسرهم والأخصائيين في بيئة آمنة ومحفّزة.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <button className="btn-primary" style={{ fontSize: 16, padding: "15px 36px" }}>
              ابدأ رحلتك مجاناً ←
            </button>
            <button className="btn-outline">
              🎥 شاهد كيف تعمل
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 32, marginTop: 44 }}>
            {[
              { num: "+2000", label: "طفل مستفيد" },
              { num: "98%",   label: "رضا الأسر" },
              { num: "150+",  label: "أخصائي معتمد" },
            ].map(({ num, label }) => (
              <div key={label}>
                <div style={{
                  fontFamily: "Cairo, sans-serif",
                  fontSize:   28,
                  fontWeight: 900,
                  color:      C.primary,
                }}>{num}</div>
                <div style={{ fontSize: 13, color: C.textSoft }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Floating Card */}
        <div
          className="hero-card"
          style={{
            position:       "relative",
            display:        "flex",
            justifyContent: "center",
            alignItems:     "center",
            animation:      "scaleIn 0.8s ease 0.2s both",
          }}
        >
          <HeroCard />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
//  HERO CARD (child mood tracker)
// ─────────────────────────────────────────────────────────────
function HeroCard() {
  const moods = [
    { emoji: "😊", label: "سعيد",  active: true  },
    { emoji: "😐", label: "عادي",  active: false },
    { emoji: "😢", label: "حزين", active: false },
    { emoji: "😰", label: "قلق",   active: false },
    { emoji: "😡", label: "غاضب", active: false },
  ];

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 390 }}>
      {/* Main card */}
      <div style={{
        background:   C.white,
        borderRadius: 28,
        padding:      30,
        boxShadow:    "0 30px 80px rgba(0,0,0,0.13)",
        animation:    "float 6s ease-in-out infinite",
        position:     "relative",
        zIndex:       2,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <span style={{ fontFamily: "Cairo", fontWeight: 700, fontSize: 15 }}>مزاج أحمد اليوم</span>
          <span style={{ fontSize: 12, color: C.textSoft }}>الأحد، 5 يناير</span>
        </div>

        {/* Mood selector */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 26 }}>
          {moods.map(({ emoji, label, active }) => (
            <div key={label} style={{
              display:        "flex",
              flexDirection:  "column",
              alignItems:     "center",
              gap:            6,
              padding:        "10px 8px",
              borderRadius:   14,
              cursor:         "pointer",
              background:     active ? `${C.primary}14` : "transparent",
              border:         active ? `2px solid ${C.primary}30` : "2px solid transparent",
            }}>
              <span style={{ fontSize: 30 }}>{emoji}</span>
              <span style={{
                fontSize:   11,
                color:      active ? C.primary : C.textSoft,
                fontWeight: active ? 700 : 400,
              }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: C.textMid, fontWeight: 600 }}>تقدم الأسبوع</span>
            <span style={{ fontSize: 13, color: C.green, fontWeight: 700 }}>78%</span>
          </div>
          <div style={{ height: 8, background: C.border, borderRadius: 8 }}>
            <div style={{
              height:     "100%",
              width:      "78%",
              background: `linear-gradient(90deg, ${C.green}, ${C.greenLight})`,
              borderRadius: 8,
            }} />
          </div>
        </div>

        {/* Stars badge */}
        <div style={{
          display:      "flex",
          alignItems:   "center",
          gap:          12,
          background:   `${C.accent}12`,
          borderRadius: 14,
          padding:      "12px 16px",
        }}>
          <span style={{ fontSize: 24 }}>⭐</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>جمع 12 نجمة اليوم!</div>
            <div style={{ fontSize: 11, color: C.textSoft }}>3 نجوم للمستوى التالي</div>
          </div>
        </div>
      </div>

      {/* Floating badge — session */}
      <div style={{
        position:     "absolute",
        top:          -12,
        left:         -24,
        zIndex:       3,
        background:   C.white,
        borderRadius: 16,
        padding:      "12px 18px",
        boxShadow:    "0 10px 30px rgba(0,0,0,0.12)",
        animation:    "floatSlow 5s ease-in-out infinite 1s",
      }}>
        <div style={{ fontSize: 11, color: C.textSoft, marginBottom: 4 }}>جلسة اليوم</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.green }}>✅ مكتملة</div>
      </div>

      {/* Floating badge — specialist */}
      <div style={{
        position:     "absolute",
        bottom:       10,
        right:        -28,
        zIndex:       3,
        background:   C.white,
        borderRadius: 16,
        padding:      "12px 18px",
        boxShadow:    "0 10px 30px rgba(0,0,0,0.12)",
        animation:    "floatSlow 7s ease-in-out infinite 0.5s",
      }}>
        <div style={{ fontSize: 11, color: C.textSoft, marginBottom: 4 }}>أخصائي متاح</div>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>د. سارة محمود</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  STATS BAR
// ─────────────────────────────────────────────────────────────
function StatsSection() {
  const stats = [
    { icon: "👶", num: "2,400+", label: "طفل يستخدم المنصة" },
    { icon: "👩‍⚕️", num: "150+",  label: "أخصائي نفسي معتمد" },
    { icon: "🎮", num: "80+",   label: "لعبة علاجية تفاعلية" },
    { icon: "⭐", num: "4.9/5", label: "متوسط التقييم" },
  ];

  return (
    <section style={{
      background: `linear-gradient(135deg, ${C.primaryDark}, ${C.primary})`,
      padding:    "52px 5%",
    }}>
      <div style={{
        maxWidth:            1100,
        margin:              "0 auto",
        display:             "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap:                 24,
      }} className="stats-grid">
        {stats.map(({ icon, num, label }) => (
          <div key={label} style={{
            textAlign:  "center",
            padding:    "26px 20px",
            borderRadius: 20,
            background: "rgba(255,255,255,0.10)",
            border:     "1px solid rgba(255,255,255,0.15)",
            transition: "transform 0.2s",
            cursor:     "default",
          }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >
            <div style={{ fontSize: 36, marginBottom: 10 }}>{icon}</div>
            <div style={{
              fontFamily: "Cairo, sans-serif",
              fontWeight: 900,
              fontSize:   32,
              color:      "white",
              marginBottom: 4,
            }}>{num}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>{label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
//  WHO IT'S FOR — Tabs
// ─────────────────────────────────────────────────────────────
const FEATURES = {
  child: [
    { icon: "😊", title: "بطاقات المشاعر PECS",     color: C.primary, desc: "الطفل يختار صورة تعبّر عن شعوره — مصممة بالكامل لغير الناطقين." },
    { icon: "🧩", title: "ألعاب التسلسل المعرفي",   color: C.accent,  desc: "مهام من 3 خطوات تطور التخطيط والتركيز مع تعزيز إيجابي فوري." },
    { icon: "⭐", title: "نظام النجوم والمستويات",  color: C.green,   desc: "كل نشاط = نجوم، كل نجوم = مكافأة افتراضية جميلة تحفّز العودة." },
    { icon: "🦋", title: "رفيق مخصص",              color: C.lavender, desc: "شخصية مرسومة ترافق الطفل في كل مكان — قابلة للتخصيص الكامل." },
    { icon: "🎵", title: "تحفيز سمعي هادئ",         color: C.primaryLight, desc: "أصوات طبيعية ناعمة اختيارية — بدون مفاجآت تسبب ضيقاً حسياً." },
    { icon: "🌈", title: "Offline Mode كامل",       color: C.teal,    desc: "كل الألعاب تعمل بدون إنترنت — لا يتوقف تقدم الطفل في أي مكان." },
  ],
  mother: [
    { icon: "📊", title: "تقارير المزاج اليومية",  color: C.primary, desc: "خط زمني بصري يُظهر حالة طفلك على مدار الأسبوع — بلمحة واحدة." },
    { icon: "🔔", title: "تنبيهات ذكية",           color: C.accent,  desc: "إشعارات مخصصة: تقدّم، تحسّن، تنبيه، أو نصيحة ABA يومية للبيت." },
    { icon: "📄", title: "تقرير PDF أسبوعي",       color: C.green,   desc: "تقرير احترافي كامل بضغطة زر — شاركيه مع الأخصائي قبل الجلسة." },
    { icon: "📅", title: "إدارة المواعيد",          color: C.lavender, desc: "احجزي جلسات مع أخصائيين معتمدين من داخل المنصة بدون تعقيد." },
  ],
  specialist: [
    { icon: "📋", title: "خطط علاج فردية",         color: C.primary, desc: "أنشئ خطة علاجية مخصصة لكل طفل وتابعها يومياً بشكل دقيق." },
    { icon: "🎥", title: "جلسات فيديو مباشرة",     color: C.accent,  desc: "جلسات Live مدمجة في المنصة مع أولياء الأمور والحضانات." },
    { icon: "📝", title: "توثيق الملاحظات",         color: C.green,   desc: "سجّل ملاحظاتك السلوكية وتابع تطور الحالة عبر الزمن." },
    { icon: "📈", title: "تحليل بيانات الحالة",    color: C.lavender, desc: "رسوم بيانية تفاعلية تُظهر تطور الطفل عبر الأسابيع والأشهر." },
  ],
};

function FeaturesSection() {
  const [activeTab, setActiveTab] = useState("child");
  const features = FEATURES[activeTab];
  const isWide = activeTab === "child" || activeTab === "specialist";

  return (
    <section style={{ padding: "96px 5%", background: C.bg }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <Reveal style={{ textAlign: "center", marginBottom: 60 }}>
          <SectionLabel text="من يستفيد من تواصل؟" />
          <h2 style={{
            fontFamily:   "Cairo, sans-serif",
            fontSize:     "clamp(28px, 3.5vw, 44px)",
            fontWeight:   900,
            marginBottom: 14,
            color:        C.text,
          }}>
            منصة واحدة، ثلاثة عوالم
          </h2>
          <p style={{ color: C.textMid, fontSize: 17, maxWidth: 500, margin: "0 auto" }}>
            كل قسم مصمم بعناية لاحتياجات مستخدمه تحديداً
          </p>
        </Reveal>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 44 }}>
          {[
            { key: "child",      label: "👶 بوابة الطفل"   },
            { key: "mother",     label: "👩 لوحة الأسرة"   },
            { key: "specialist", label: "👨‍⚕️ بوابة الأخصائي" },
          ].map(({ key, label }) => (
            <button
              key={key}
              className={`tab-btn ${activeTab === key ? "active" : ""}`}
              onClick={() => setActiveTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Feature cards */}
        <Reveal>
          <div style={{
            display:             "grid",
            gridTemplateColumns: isWide ? "repeat(3,1fr)" : "repeat(2,1fr)",
            gap:                 20,
          }} className="feat-grid">
            {features.map(({ icon, title, color, desc }) => (
              <div key={title} className="feature-card" style={{ padding: "26px 24px" }}>
                <div style={{
                  width:        52,
                  height:       52,
                  borderRadius: 16,
                  background:   color + "18",
                  fontSize:     26,
                  display:      "flex",
                  alignItems:   "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}>
                  {icon}
                </div>
                <h3 style={{
                  fontFamily:   "Cairo, sans-serif",
                  fontSize:     16,
                  fontWeight:   700,
                  marginBottom: 8,
                  color:        C.text,
                }}>
                  {title}
                </h3>
                <p style={{ fontSize: 13, color: C.textMid, lineHeight: 1.75 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
//  HOW IT WORKS
// ─────────────────────────────────────────────────────────────
function HowItWorksSection() {
  const steps = [
    { n: "1", icon: "📝", title: "سجّل مجاناً",      desc: "أنشئ حسابك كولي أمر أو أخصائي في دقيقتين بدون بطاقة بنكية." },
    { n: "2", icon: "👤", title: "أضف ملف طفلك",    desc: "أدخل معلومات بسيطة عن طفلك لتخصيص تجربته الكاملة تلقائياً." },
    { n: "3", icon: "🚀", title: "ابدأ الرحلة",      desc: "الطفل يلعب ويتعلم، وأنت تتابع تقدمه في الوقت الفعلي." },
  ];

  return (
    <section style={{ padding: "96px 5%", background: C.bgWarm }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <Reveal style={{ textAlign: "center", marginBottom: 66 }}>
          <SectionLabel text="كيف تعمل المنصة؟" color={C.primary} />
          <h2 style={{
            fontFamily: "Cairo, sans-serif",
            fontSize:   "clamp(26px, 3vw, 40px)",
            fontWeight: 900,
            color:      C.text,
          }}>
            ثلاث خطوات للبدء
          </h2>
        </Reveal>

        <div style={{
          display:             "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap:                 48,
        }} className="steps-grid">
          {steps.map(({ n, icon, title, desc }, i) => (
            <Reveal key={n} delay={i * 0.15} style={{ textAlign: "center" }}>
              <div style={{
                width:        80,
                height:       80,
                borderRadius: "50%",
                margin:       "0 auto 22px",
                background:   C.white,
                border:       `3px solid ${C.primary}`,
                display:      "flex",
                alignItems:   "center",
                justifyContent: "center",
                fontSize:     32,
                boxShadow:    `0 8px 24px ${C.primary}22`,
              }}>
                {icon}
              </div>
              <h3 style={{
                fontFamily:   "Cairo, sans-serif",
                fontSize:     20,
                fontWeight:   800,
                marginBottom: 10,
                color:        C.text,
              }}>
                {title}
              </h3>
              <p style={{ color: C.textMid, fontSize: 14, lineHeight: 1.8 }}>{desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
//  SPECIALISTS
// ─────────────────────────────────────────────────────────────
function SpecialistsSection() {
  const specialists = [
    { name: "د. سارة محمود", spec: "أخصائية ABA",        rating: 4.9, sessions: 340, color: C.primary,  emoji: "👩‍⚕️" },
    { name: "د. أحمد كريم",  spec: "معالج نفسي أطفال",  rating: 4.8, sessions: 280, color: C.accent,   emoji: "👨‍⚕️" },
    { name: "د. منى حسن",   spec: "أخصائية PECS",       rating: 5.0, sessions: 412, color: C.green,    emoji: "👩‍💼" },
    { name: "د. خالد يوسف", spec: "معالج سلوكي",        rating: 4.9, sessions: 195, color: C.lavender, emoji: "👨‍💼" },
  ];

  return (
    <section style={{ padding: "96px 5%", background: C.bg }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <Reveal style={{ textAlign: "center", marginBottom: 54 }}>
          <SectionLabel text="فريقنا من الخبراء" color={C.green} />
          <h2 style={{
            fontFamily:   "Cairo, sans-serif",
            fontSize:     "clamp(26px, 3vw, 40px)",
            fontWeight:   900,
            marginBottom: 14,
            color:        C.text,
          }}>
            أخصائيون معتمدون في خدمتكم
          </h2>
        </Reveal>

        <div style={{
          display:             "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap:                 20,
        }} className="spec-grid">
          {specialists.map(({ name, spec, rating, sessions, color, emoji }, i) => (
            <Reveal key={name} delay={i * 0.1}>
              <div className="specialist-card" style={{ padding: 24, textAlign: "center" }}>
                <div style={{
                  width:        76,
                  height:       76,
                  borderRadius: "50%",
                  margin:       "0 auto 16px",
                  background:   color + "20",
                  fontSize:     38,
                  display:      "flex",
                  alignItems:   "center",
                  justifyContent: "center",
                  border:       `2px solid ${color}30`,
                }}>
                  {emoji}
                </div>
                <h4 style={{
                  fontFamily:   "Cairo, sans-serif",
                  fontSize:     15,
                  fontWeight:   700,
                  marginBottom: 4,
                  color:        C.text,
                }}>
                  {name}
                </h4>
                <div style={{ fontSize: 12, color, fontWeight: 700, marginBottom: 12 }}>{spec}</div>
                <div style={{ display: "flex", justifyContent: "center", gap: 14, marginBottom: 14 }}>
                  <span style={{ fontSize: 12, color: C.textSoft }}>⭐ {rating}</span>
                  <span style={{ fontSize: 12, color: C.textSoft }}>{sessions} جلسة</span>
                </div>
                <div style={{
                  display:      "flex",
                  alignItems:   "center",
                  justifyContent: "center",
                  gap:          6,
                  marginBottom: 16,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green }} />
                  <span style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>متاح الآن</span>
                </div>
                <button style={{
                  width:        "100%",
                  background:   color + "14",
                  color,
                  border:       `1px solid ${color}30`,
                  borderRadius: 12,
                  padding:      "9px 0",
                  fontSize:     13,
                  fontWeight:   700,
                  cursor:       "pointer",
                  fontFamily:   "Tajawal, sans-serif",
                  transition:   "all 0.2s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = color; e.currentTarget.style.color = "white"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = color + "14"; e.currentTarget.style.color = color; }}
                >
                  احجز جلسة
                </button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
//  TESTIMONIALS
// ─────────────────────────────────────────────────────────────
function TestimonialsSection() {
  const testimonials = [
    {
      quote:  "ابني يفتح تواصل كل يوم وحده — لأول مرة في حياتي أشوفه مبسوط وهو بيتعلم.",
      name:   "أم عمر، القاهرة",
      avatar: "👩",
    },
    {
      quote:  "التقارير الأسبوعية وفّرت عليّ ساعات من التوثيق. بقيت أركز في الطفل مش الورق.",
      name:   "د. منى — أخصائية ABA",
      avatar: "👩‍⚕️",
    },
    {
      quote:  "بعد شهرين على تواصل، ابنتي بدأت تعبّر عن مشاعرها للمرة الأولى بالصور.",
      name:   "أبو نور، الإسكندرية",
      avatar: "👨",
    },
  ];

  return (
    <section style={{
      padding:    "88px 5%",
      background: "linear-gradient(135deg, #EBF4F8 0%, #EDE8F4 100%)",
    }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <Reveal style={{ textAlign: "center", marginBottom: 52 }}>
          <SectionLabel text="آراء الأسر" color={C.lavender} />
          <h2 style={{
            fontFamily: "Cairo, sans-serif",
            fontSize:   "clamp(26px, 3vw, 38px)",
            fontWeight: 900,
            color:      C.text,
          }}>
            ماذا يقول مستخدمونا؟
          </h2>
        </Reveal>

        <div style={{
          display:             "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap:                 22,
        }} className="test-grid">
          {testimonials.map(({ quote, name, avatar }, i) => (
            <Reveal key={i} delay={i * 0.12}>
              <div className="testimonial-card" style={{ padding: 28 }}>
                <div style={{
                  fontSize:     44,
                  color:        C.primaryLight,
                  opacity:      0.35,
                  lineHeight:   1,
                  marginBottom: 12,
                }}>"</div>
                <p style={{
                  fontSize:     14,
                  lineHeight:   1.85,
                  color:        C.textMid,
                  marginBottom: 22,
                }}>
                  {quote}
                </p>
                <div style={{
                  display:     "flex",
                  alignItems:  "center",
                  gap:         12,
                  borderTop:   `1px solid ${C.border}`,
                  paddingTop:  18,
                }}>
                  <div style={{ fontSize: 30 }}>{avatar}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{name}</div>
                    <div style={{ fontSize: 12, color: C.accent }}>⭐⭐⭐⭐⭐</div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
//  CTA SECTION
// ─────────────────────────────────────────────────────────────
function CTASection() {
  return (
    <section style={{
      padding:    "96px 5%",
      background: `linear-gradient(135deg, ${C.primaryDark} 0%, ${C.primary} 60%, ${C.lavender} 100%)`,
      textAlign:  "center",
      position:   "relative",
      overflow:   "hidden",
    }}>
      <div className="blob" style={{
        position:   "absolute",
        width:      400,
        height:     400,
        background: "rgba(255,255,255,0.06)",
        top:        -100,
        right:      -100,
      }} />
      <Reveal style={{ position: "relative", zIndex: 1 }}>
        <h2 style={{
          fontFamily:   "Cairo, sans-serif",
          fontSize:     "clamp(28px, 4vw, 52px)",
          fontWeight:   900,
          color:        "white",
          marginBottom: 16,
        }}>
          ابدأ رحلة طفلك اليوم
        </h2>
        <p style={{
          color:        "rgba(255,255,255,0.85)",
          fontSize:     17,
          marginBottom: 40,
          maxWidth:     480,
          margin:       "0 auto 40px",
        }}>
          انضم لأكثر من 2000 أسرة تثق في تواصل لدعم تطور أطفالها
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <button style={{
            background:   "white",
            color:        C.primary,
            border:       "none",
            padding:      "16px 42px",
            borderRadius: 50,
            fontSize:     17,
            fontWeight:   800,
            cursor:       "pointer",
            fontFamily:   "Cairo, sans-serif",
            boxShadow:    "0 8px 30px rgba(0,0,0,0.2)",
            transition:   "transform 0.2s",
          }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >
            ابدأ مجاناً ←
          </button>
          <button style={{
            background:  "rgba(255,255,255,0.15)",
            color:       "white",
            border:      "2px solid rgba(255,255,255,0.5)",
            padding:     "14px 38px",
            borderRadius: 50,
            fontSize:    16,
            fontWeight:  700,
            cursor:      "pointer",
            fontFamily:  "Cairo, sans-serif",
            backdropFilter: "blur(10px)",
            transition:  "background 0.2s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
          >
            تحدث مع أخصائي
          </button>
        </div>
      </Reveal>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
//  FOOTER
// ─────────────────────────────────────────────────────────────
function Footer() {
  const columns = [
    { title: "المنصة",  links: ["الأقسام", "الأخصائيون", "الألعاب", "التقارير"] },
    { title: "الدعم",   links: ["مركز المساعدة", "تواصل معنا", "سياسة الخصوصية"] },
    { title: "عن تواصل", links: ["من نحن", "الفريق", "شركاؤنا"] },
  ];

  return (
    <footer style={{
      background: C.text,
      color:      "rgba(255,255,255,0.7)",
      padding:    "54px 5% 32px",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{
          display:             "grid",
          gridTemplateColumns: "2fr 1fr 1fr 1fr",
          gap:                 44,
          marginBottom:        44,
        }} className="footer-grid">
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{
                width:        40,
                height:       40,
                borderRadius: 11,
                background:   C.primary,
                display:      "flex",
                alignItems:   "center",
                justifyContent: "center",
                fontSize:     18,
              }}>🤝</div>
              <span style={{
                fontFamily: "Cairo, sans-serif",
                fontWeight: 900,
                fontSize:   22,
                color:      "white",
              }}>تواصل</span>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.8, maxWidth: 260 }}>
              منصة تفاعلية متكاملة لدعم أطفال التوحد وذوي الاحتياجات الخاصة وأسرهم.
            </p>
          </div>

          {/* Columns */}
          {columns.map(({ title, links }) => (
            <div key={title}>
              <div style={{
                fontFamily:   "Cairo, sans-serif",
                fontWeight:   700,
                color:        "white",
                fontSize:     15,
                marginBottom: 18,
              }}>
                {title}
              </div>
              {links.map(link => (
                <div key={link} style={{
                  fontSize:     13,
                  marginBottom: 10,
                  cursor:       "pointer",
                  transition:   "color 0.2s",
                }}
                  onMouseEnter={e => e.currentTarget.style.color = "white"}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}
                >
                  {link}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop:   "1px solid rgba(255,255,255,0.10)",
          paddingTop:  22,
          display:     "flex",
          justifyContent: "space-between",
          flexWrap:    "wrap",
          gap:         12,
        }}>
          <span style={{ fontSize: 13 }}>© 2025 منصة تواصل — جميع الحقوق محفوظة</span>
          <span style={{ fontSize: 13 }}>صُنع بـ ❤️ لأطفالنا</span>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────────
//  ROOT COMPONENT
// ─────────────────────────────────────────────────────────────
export default function Landing() {
  return (
    <div style={{
      fontFamily: "'Tajawal', sans-serif",
      direction:  "rtl",
      background: C.bg,
      color:      C.text,
      overflowX:  "hidden",
      width: "100%",      
      minHeight: "100vh",   
    }}>
      <GlobalStyles />
      <Navbar />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <SpecialistsSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
}