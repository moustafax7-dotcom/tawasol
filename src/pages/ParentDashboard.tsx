import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useParentDashboardData } from "../hooks/useParentDashboardData";
import NotificationBell from "../components/NotificationBell";

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
function MoodCard({ child, moodToday, weekMoods }: any) {
  const m = moodToday;
  return (
    <Card>
      <div style={{ padding: "20px" }}>
        <SectionLabel>مزاج {child.full_name.split(" ")[0]} النهارده</SectionLabel>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: m.bg, border: `2px solid ${m.color}44`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 42,
          }}>{m.emoji}</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: T.text }}>{m.label}</div>
          </div>
        </div>

        {weekMoods.length > 0 && (
          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 14 }}>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 10, fontWeight: 600 }}>مزاجه طول الأسبوع</div>
            <div style={{ display: "flex", gap: 6, justifyContent: "space-between" }}>
              {weekMoods.map((d: any, i: number) => (
                <div key={i} style={{ textAlign: "center", flex: 1 }}>
                  <div style={{
                    width: "100%", aspectRatio: "1", borderRadius: 12,
                    background: d.color + "22",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, marginBottom: 4,
                  }}>{d.emoji}</div>
                  <div style={{ fontSize: 9, color: T.textMuted }}>{d.day}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Specialist Card ──────────────────────────────────────────────────────────
function SpecialistCard({ specialist, progress }: any) {
  if (!specialist) {
    return (
      <Card>
        <div style={{ padding: "20px", textAlign: "center", color: T.textMuted, fontSize: 13 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>👨‍⚕️</div>
          لسه مفيش أخصائي متابع للطفل ده
        </div>
      </Card>
    );
  }
  return (
    <Card>
      <div style={{ padding: "20px" }}>
        <SectionLabel>الأخصائي المتابع</SectionLabel>
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 18 }}>
          <div style={{
            width: 54, height: 54, borderRadius: 16,
            background: T.tealBg, border: `2px solid ${T.teal}33`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, fontWeight: 900, color: T.teal, flexShrink: 0,
          }}>{specialist.name?.[0] || "؟"}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>{specialist.name}</div>
            <div style={{ fontSize: 12, color: T.textMuted }}>{specialist.title}</div>
          </div>
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: T.textMuted }}>مهام النهاردة</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: T.primary }}>{progress}%</span>
          </div>
          <div style={{ height: 8, background: T.border, borderRadius: 999, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${progress}%`,
              background: `linear-gradient(90deg, ${T.primary}, ${T.primaryLight})`,
            }} />
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── Calendar / Tasks Card ─────────────────────────────────────────────────────
function CalendarCard({ tasksToday, streak, progress }: any) {
  return (
    <Card>
      <div style={{ padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <SectionLabel>مهام النهاردة</SectionLabel>
          <div style={{ position: "relative", width: 56, height: 56, flexShrink: 0 }}>
            <ProgressRing pct={progress} size={56} />
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 900, color: T.primary,
            }}>{progress}%</div>
          </div>
        </div>

        {streak > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 14px", borderRadius: 12,
            background: T.primaryBg, marginBottom: 16,
          }}>
            <span style={{ fontSize: 20 }}>🔥</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.primary }}>
              {streak} أيام متتالية إنجاز! عظيم!
            </span>
          </div>
        )}

        {tasksToday.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px", color: T.textMuted, fontSize: 13 }}>
            لسه مفيش مهام مضافة للنهاردة
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {tasksToday.map((task: any) => (
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
        )}
      </div>
    </Card>
  );
}

// ─── Games Card ───────────────────────────────────────────────────────────────
function GamesCard({ gamesToday }: any) {
  const totalMinutes = gamesToday.reduce((sum: number, g: any) => sum + Math.round((g.duration_seconds || 0) / 60), 0);
  return (
    <Card>
      <div style={{ padding: "20px" }}>
        <SectionLabel>الألعاب اللي لعبها النهارده</SectionLabel>

        {gamesToday.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px", color: T.textMuted, fontSize: 13 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🎮</div>
            لسه ما لعبش أي لعبة النهارده
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {gamesToday.map((g: any) => (
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
                }}>🎮</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{g.games?.title || "لعبة"}</div>
                  <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>
                    🕐 {new Date(g.played_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                    {" · "}{Math.round((g.duration_seconds || 0) / 60)} دقيقة
                  </div>
                  <div style={{ marginTop: 5 }}>
                    <Stars count={Math.min(5, Math.round((g.score || 0) / 20))} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {gamesToday.length > 0 && (
          <div style={{
            marginTop: 14, padding: "10px 14px", borderRadius: 12,
            background: T.secondaryBg, border: `1px solid ${T.secondary}22`,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 600 }}>إجمالي وقت الألعاب</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: T.secondary }}>{totalMinutes} دقيقة</span>
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
function Header({ child, children, selectedChildId, onSelectChild }: any) {
  const today = new Date().toLocaleDateString("ar-EG", { weekday:"long", day:"numeric", month:"long" });
  return (
    <div style={{
      padding: "20px 20px 18px",
      background: T.surface,
      borderBottom: `1px solid ${T.border}`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 2 }}>{today}</div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: T.text, margin: 0 }}>
            متابعة {child.full_name} 👨‍👩‍👦
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <NotificationBell color={T.primary} />
          <div style={{
            width: 42, height: 42, borderRadius: 14,
            background: T.primaryBg, border: `2px solid ${T.primaryLight}44`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22,
          }}>👦</div>
        </div>
      </div>

      {/* Child switcher — يظهر بس لو أكتر من طفل */}
      {children.length > 1 && (
        <div style={{ display: "flex", gap: 8, marginTop: 14, overflowX: "auto" }}>
          {children.map((c: any) => (
            <button
              key={c.id}
              onClick={() => onSelectChild(c.id)}
              style={{
                padding: "6px 16px", borderRadius: 999, whiteSpace: "nowrap",
                border: `1.5px solid ${c.id === selectedChildId ? T.primary : T.border}`,
                background: c.id === selectedChildId ? T.primaryBg : T.surface,
                color: c.id === selectedChildId ? T.primary : T.textMuted,
                fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {c.full_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Add Child Form ───────────────────────────────────────────────────────────
function AddChildForm({ onAdd }: { onAdd: (v: { fullName: string; age: number }) => Promise<{ error: string | null }> }) {
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !age) {
      setErr("محتاجين اسم الطفل وسنّه");
      return;
    }
    setSubmitting(true);
    setErr("");
    try {
      const { error } = await onAdd({ fullName: fullName.trim(), age: Number(age) });
      if (error) setErr(error);
    } catch {
      setErr("تعذر حفظ بيانات الطفل. حاول مرة أخرى.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{
      maxWidth: 340, margin: "20px auto 0", display: "flex",
      flexDirection: "column", gap: 10, textAlign: "right",
    }}>
      <input
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="اسم الطفل"
        style={{
          padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${T.border}`,
          fontSize: 14, fontFamily: "inherit", textAlign: "right",
        }}
      />
      <input
        value={age}
        onChange={(e) => setAge(e.target.value)}
        type="number"
        placeholder="عمر الطفل"
        style={{
          padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${T.border}`,
          fontSize: 14, fontFamily: "inherit", textAlign: "right",
        }}
      />
      {err && <div style={{ color: "#E05555", fontSize: 12, textAlign: "center" }}>{err}</div>}
      <button
        type="submit"
        disabled={submitting}
        style={{
          padding: "12px", borderRadius: 999, border: "none",
          background: T.primary, color: "#fff", fontSize: 14, fontWeight: 800,
          cursor: "pointer", fontFamily: "inherit",
        }}
      >
        {submitting ? "جاري الإضافة..." : "أضف الطفل"}
      </button>
    </form>
  );
}


export default function ParentDashboard() {
  const {
    children, selectedChild, selectedChildId, setSelectedChildId, addChild,
    specialist, moodToday, weekMoods, tasksToday, gamesToday, streak, progress,
    loading, childrenLoading, error, refresh,
  } = useParentDashboardData();
  const navigate = useNavigate();

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
        {!selectedChild ? (
          <div style={{ padding: 60, textAlign: "center", color: T.textMuted }}>
            {error
              ? `حصل خطأ: ${error}`
              : childrenLoading
              ? "بنجهّز بيانات طفلك..."
              : (
                <div>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>👶</div>
                  <div style={{ fontWeight: 800, color: T.text, marginBottom: 6 }}>لسه مفيش طفل مسجل على حسابك</div>
                  <div style={{ fontSize: 13, marginBottom: 4 }}>أضف بيانات طفلك عشان تقدر تتابع تقدمه هنا</div>
                  <AddChildForm onAdd={addChild} />
                </div>
              )}
          </div>
        ) : (
          <>
            <Header
              child={selectedChild}
              children={children}
              selectedChildId={selectedChildId}
              onSelectChild={setSelectedChildId}
            />

            <div style={{ maxWidth: 680, margin: "0 auto", padding: "20px 16px 40px" }}>
              {/* Child summary banner */}
              <div style={{
                padding: "16px 20px", borderRadius: 20, marginBottom: 20,
                background: `linear-gradient(135deg, ${T.primary} 0%, ${T.secondary} 100%)`,
                display: "flex", alignItems: "center", gap: 16,
                boxShadow: `0 8px 24px ${T.primary}33`,
              }}>
                <div style={{ fontSize: 44 }}>👦</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 17, fontWeight: 900, color: "#fff" }}>{selectedChild.full_name}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>{selectedChild.age} سنوات</div>
                  <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
                    {[
                      { icon:"🔥", val:`${streak} أيام` },
                      { icon:"📈", val:`${progress}%` },
                      { icon:"🎮", val:`${gamesToday.length} ألعاب` },
                    ].map(({icon,val}) => (
                      <div key={val} style={{
                        padding: "4px 10px", borderRadius: 999,
                        background: "rgba(255,255,255,0.2)",
                        fontSize: 12, fontWeight: 700, color: "#fff",
                      }}>{icon} {val}</div>
                    ))}
                    <button
                      onClick={() => navigate("/kids")}
                      style={{
                        padding: "5px 14px", borderRadius: 999, border: "none",
                        background: "#fff", color: T.primary,
                        fontSize: 12, fontWeight: 800, cursor: "pointer",
                        fontFamily: "inherit", marginRight: "auto",
                      }}
                    >
                      🎮 داشبورد {selectedChild.full_name.split(" ")[0]}
                    </button>
                  </div>
                </div>
              </div>

              {error && <div role="alert" style={{ padding: 16, marginBottom: 16, color: "#9B3030", background: "#FFF0F0", borderRadius: 12 }}>{error} <button onClick={refresh}>إعادة المحاولة</button></div>}
              {loading ? (
                <div style={{ textAlign: "center", padding: 40, color: T.textMuted }}>بيتحمّل...</div>
              ) : !error && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <MoodCard child={selectedChild} moodToday={moodToday} weekMoods={weekMoods} />
                  <SpecialistCard specialist={specialist} progress={progress} />
                  <CalendarCard tasksToday={tasksToday} streak={streak} progress={progress} />
                  <GamesCard gamesToday={gamesToday} />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
