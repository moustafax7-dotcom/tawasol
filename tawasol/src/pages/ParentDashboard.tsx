import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient.js";
// ─── Tokens ───────────────────────────────────────────────────────────────────
const T = {
  primary:   "#E9824C", primaryBg: "#FEF0E8", primaryLight:"#F5A47C",
  secondary: "#8E80BC", secondaryBg:"#F0EEF8",
  teal:      "#6B8FA8", tealBg:    "#EBF2F7",
  bg:        "#F5F2EE", surface:   "#FFFFFF", surfaceAlt:"#FAF8F5",
  text:      "#2C2C3A", textMuted: "#8A8A9A", textLight:"#B0B0BC",
  border:    "#EAE6DE", success:   "#5BB88A", successBg:"#EAF7F1",
  shadow:    "rgba(44,44,58,0.07)", shadowMd:"rgba(44,44,58,0.13)",
};

// ─── Mock child data ──────────────────────────────────────────────────────────
const CHILD = {
  name:       "أحمد محمد",
  age:        7,
  avatar:     "👦",
  specialist: { name:"د. سارة محمود", title:"أخصائية ABA", rating:4.9, nextSession:"غداً الساعة 10:00 ص", sessionsLeft:5, totalSessions:28 },
  todayMood:  { id:"happy", emoji:"😄", label:"سعيد", color:"#FFD93D", bg:"#FFFBEA" },
  progress:   78,
  streak:     5, // days streak
};

const TASKS_TODAY = [
  { id:"pray",  emoji:"🕌", label:"صلى",            done:true },
  { id:"teeth", emoji:"🦷", label:"غسل أسنانه",     done:true },
  { id:"game",  emoji:"🎮", label:"لعب ألعاب",      done:true },
  { id:"hw",    emoji:"📚", label:"عمل الواجب",     done:false },
  { id:"read",  emoji:"📖", label:"قرأ كتاب",       done:false },
  { id:"eat",   emoji:"🥗", label:"أكل أكل صحي",    done:true },
];

const GAMES_TODAY = [
  { id:"memory", emoji:"🧠", label:"لعبة الذاكرة", duration:"15 دقيقة", stars:3, time:"10:30 ص" },
  { id:"draw",   emoji:"🎨", label:"الرسم",         duration:"20 دقيقة", stars:5, time:"04:00 م" },
];

const WEEK_MOODS = [
  { day:"أحد",  emoji:"😄", color:"#FFD93D" },
  { day:"اثن",  emoji:"😌", color:"#6BCB77" },
  { day:"ثلا",  emoji:"😢", color:"#74B9FF" },
  { day:"أرب",  emoji:"😄", color:"#FFD93D" },
  { day:"خمس",  emoji:"😤", color:"#FF6B6B" },
  { day:"جمع",  emoji:"😌", color:"#6BCB77" },
  { day:"سبت",  emoji:"😄", color:"#FFD93D" },
];

// ─── Helper components ────────────────────────────────────────────────────────
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: T.surface, borderRadius: 20,
      border: `1px solid ${T.border}`,
      boxShadow: `0 2px 12px ${T.shadow}`,
      overflow: "hidden", ...style,
    }}>{children}</div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 800, color: T.textMuted, letterSpacing: 0.8, marginBottom: 12, textTransform: "uppercase" }}>
      {children}
    </div>
  );
}

function Stars({ count }: { count: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: 11, opacity: i <= count ? 1 : 0.2 }}>⭐</span>
      ))}
    </div>
  );
}

function ProgressRing({ pct, size = 80 }: { pct: number; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.border} strokeWidth={8}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.primary} strokeWidth={8}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.6s ease" }}/>
    </svg>
  );
}

// ─── Mood Card ────────────────────────────────────────────────────────────────
function MoodCard() {
  const m = CHILD.todayMood;
  return (
    <Card>
      <div style={{ padding: "20px" }}>
        <SectionLabel>مزاج أحمد النهارده</SectionLabel>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: m.bg, border: `2px solid ${m.color}44`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 42,
          }}>{m.emoji}</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: T.text }}>{m.label} 😊</div>
            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>سجّله الساعة 8:30 ص</div>
            <div style={{
              marginTop: 8, display: "inline-block",
              padding: "4px 12px", borderRadius: 999,
              background: m.bg, color: m.color,
              fontSize: 12, fontWeight: 700,
            }}>يوم حلو 🌟</div>
          </div>
        </div>

        {/* Week mood strip */}
        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 14 }}>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 10, fontWeight: 600 }}>مزاجه طول الأسبوع</div>
          <div style={{ display: "flex", gap: 6, justifyContent: "space-between" }}>
            {WEEK_MOODS.map((d, i) => (
              <div key={i} style={{ textAlign: "center", flex: 1 }}>
                <div style={{
                  width: "100%", aspectRatio: "1", borderRadius: 12,
                  background: d.color + "22",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, marginBottom: 4,
                  border: i === 6 ? `2px solid ${d.color}` : "none",
                }}>{d.emoji}</div>
                <div style={{ fontSize: 9, color: T.textMuted }}>{d.day}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── Specialist Card ──────────────────────────────────────────────────────────
function SpecialistCard() {
  const sp = CHILD.specialist;
  return (
    <Card>
      <div style={{ padding: "20px" }}>
        <SectionLabel>الأخصائي المتابع</SectionLabel>
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 18 }}>
          {/* Avatar */}
          <div style={{
            width: 54, height: 54, borderRadius: 16,
            background: T.tealBg, border: `2px solid ${T.teal}33`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, fontWeight: 900, color: T.teal, flexShrink: 0,
          }}>سم</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>{sp.name}</div>
            <div style={{ fontSize: 12, color: T.textMuted }}>{sp.title}</div>
            <div style={{ display: "flex", gap: 4, alignItems: "center", marginTop: 4 }}>
              <span style={{ fontSize: 12, color: "#E9C84C" }}>⭐</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{sp.rating}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[
            { icon:"📅", label:"الجلسة القادمة", value:sp.nextSession, color:T.primary },
            { icon:"🔢", label:"جلسات متبقية",   value:`${sp.sessionsLeft} جلسات`, color:T.secondary },
          ].map(({ icon, label, value, color }) => (
            <div key={label} style={{
              padding: "12px", borderRadius: 14,
              background: T.surfaceAlt, border: `1px solid ${T.border}`,
            }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: T.textMuted }}>التقدم العلاجي</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: T.primary }}>{CHILD.progress}%</span>
          </div>
          <div style={{ height: 8, background: T.border, borderRadius: 999, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${CHILD.progress}%`,
              background: `linear-gradient(90deg, ${T.primary}, ${T.primaryLight})`,
              borderRadius: 999, transition: "width 0.6s ease",
            }}/>
          </div>
        </div>

        <button style={{
          width: "100%", marginTop: 16, padding: "11px",
          borderRadius: 12, border: "none",
          background: T.tealBg, color: T.teal,
          fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        }}>💬 تواصل مع الأخصائية</button>
      </div>
    </Card>
  );
}

// ─── Calendar Card ────────────────────────────────────────────────────────────
function CalendarCard() {
  const done  = TASKS_TODAY.filter(t => t.done).length;
  const total = TASKS_TODAY.length;
  const pct   = Math.round((done / total) * 100);

  return (
    <Card>
      <div style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <SectionLabel>مهام اليوم</SectionLabel>
            <div style={{ fontSize: 22, fontWeight: 900, color: T.text }}>
              {done}/{total} <span style={{ fontSize: 14, color: T.textMuted, fontWeight: 500 }}>أُنجزت</span>
            </div>
          </div>
          <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
            <ProgressRing pct={pct} size={72} />
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 900, color: T.primary,
            }}>{pct}%</div>
          </div>
        </div>

        {/* Streak */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 14px", borderRadius: 12,
          background: T.primaryBg, marginBottom: 16,
        }}>
          <span style={{ fontSize: 20 }}>🔥</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.primary }}>
            {CHILD.streak} أيام متتالية إنجاز! عظيم!
          </span>
        </div>

        {/* Task list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {TASKS_TODAY.map(task => (
            <div key={task.id} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 14px", borderRadius: 14,
              background: task.done ? T.successBg : T.surfaceAlt,
              border: `1px solid ${task.done ? T.success + "33" : T.border}`,
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                background: task.done ? T.success : T.border,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, color: "#fff",
              }}>{task.done ? "✓" : ""}</div>
              <span style={{ fontSize: 20 }}>{task.emoji}</span>
              <span style={{
                flex: 1, fontSize: 14, fontWeight: 600,
                color: task.done ? T.success : T.textMuted,
                textDecoration: task.done ? "line-through" : "none",
              }}>{task.label}</span>
              {task.done && <span style={{ fontSize: 16 }}>⭐</span>}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ─── Games Card ───────────────────────────────────────────────────────────────
function GamesCard() {
  return (
    <Card>
      <div style={{ padding: "20px" }}>
        <SectionLabel>الألعاب اللي لعبها النهارده</SectionLabel>

        {GAMES_TODAY.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px", color: T.textMuted, fontSize: 13 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🎮</div>
            لم يلعب أي لعبة اليوم
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {GAMES_TODAY.map(g => (
              <div key={g.id} style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 16px", borderRadius: 16,
                background: T.surfaceAlt, border: `1px solid ${T.border}`,
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: T.secondaryBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 26, flexShrink: 0,
                }}>{g.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{g.label}</div>
                  <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>
                    🕐 {g.time} · {g.duration}
                  </div>
                  <div style={{ marginTop: 5 }}>
                    <Stars count={g.stars} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Total time */}
        <div style={{
          marginTop: 14, padding: "10px 14px", borderRadius: 12,
          background: T.secondaryBg, border: `1px solid ${T.secondary}22`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 600 }}>إجمالي وقت الألعاب</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: T.secondary }}>35 دقيقة</span>
        </div>
      </div>
    </Card>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
function Header() {
  const today = new Date().toLocaleDateString("ar-EG", { weekday:"long", day:"numeric", month:"long" });
  return (
    <div style={{
      padding: "20px 20px 18px",
      background: T.surface,
      borderBottom: `1px solid ${T.border}`,
      display: "flex", justifyContent: "space-between", alignItems: "center",
    }}>
      <div>
        <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 2 }}>{today}</div>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: T.text, margin: 0 }}>
          متابعة { CHILD.name} 👨‍👩‍👦
        </h1>
      </div>
      <div style={{
        width: 42, height: 42, borderRadius: 14,
        background: T.primaryBg, border: `2px solid ${T.primaryLight}44`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22,
      }}>{CHILD.avatar}</div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function ParentDashboard() {
  const [userName, setUserName] = useState("...");

useEffect(() => {
    const fetchUserName = async () => {
      // 1. جلب بيانات المستخدم الحالي من الـ Auth
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // 2. جلب الاسم من جدول الـ profiles الجديد
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name') // تأكد أن اسم العمود في جدولك هو full_name
          .eq('id', user.id)
          .single();
        
        if (data) {
          setUserName(data.full_name);
       } else {
  // استخدام || "" لضمان عدم تمرير undefined
  setUserName(user.email || ""); 
}
      }
    };
    
    fetchUserName();
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-thumb { background:#D8D4CC; border-radius:99px; }
      `}</style>

      <div style={{
        minHeight: "100vh", background: T.bg,
        fontFamily: "'Tajawal', sans-serif", direction: "rtl",
      }}>
        <Header />

        <div style={{ maxWidth: 680, margin: "0 auto", padding: "20px 16px 40px" }}>

          {/* Child summary banner */}
          <div style={{
            padding: "16px 20px", borderRadius: 20, marginBottom: 20,
            background: `linear-gradient(135deg, ${T.primary} 0%, ${T.secondary} 100%)`,
            display: "flex", alignItems: "center", gap: 16,
            boxShadow: `0 8px 24px ${T.primary}33`,
          }}>
            <div style={{ fontSize: 44 }}>{CHILD.avatar}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 900, color: "#fff" }}>{userName}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>{CHILD.age} سنوات</div>
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                {[
                  { icon:"🔥", val:`${CHILD.streak} أيام` },
                  { icon:"📈", val:`${CHILD.progress}%` },
                  { icon:"🎮", val:`${GAMES_TODAY.length} ألعاب` },
                ].map(({icon,val}) => (
                  <div key={val} style={{
                    padding: "4px 10px", borderRadius: 999,
                    background: "rgba(255,255,255,0.2)",
                    fontSize: 12, fontWeight: 700, color: "#fff",
                  }}>{icon} {val}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <MoodCard />
            <SpecialistCard />
            <CalendarCard />
            <GamesCard />
          </div>
        </div>
      </div>
    </>
  );
}
