// src/pages/SequencingGame.tsx
// ============================================================
// لعبة "رتّب الخطوات" — تدريب على التسلسل المعرفي والتخطيط
// (Sequential Planning / Task Analysis)
//
// الأساس العلمي: تحليل المهام (Task Analysis) هو أحد أهم أدوات
// ABA — تقسيم أي نشاط يومي إلى خطوات صغيرة مرتبة، وتدريب الطفل
// على تذكّر ترتيبها. هذا يقوّي الذاكرة التتابعية (Sequential
// Memory) والاستقلالية في الأنشطة اليومية (Daily Living Skills).
//
// آلية اللعب: الخطوات تظهر مبعثرة، الطفل يضغط على خطوتين
// لتبديل مكانهما، حتى تصبح كل الخطوات مرتبة بالترتيب الصحيح.
// ثلاث مستويات صعوبة (3 / 4 / 5 خطوات) + زرار تلميح.
//
// نفس نمط MemoryGame و AnimalSoundsGame بالظبط: onComplete/onExit
// props، وinline styles معتمدة على memoryTokens.
// ============================================================
import { useState, useEffect, useRef } from "react";
import { memoryTokens as T } from "./theme";

interface Step {
  emoji: string;
  label: string;
}

interface Routine {
  title: string;
  steps: Step[];
}

interface SequencingGameProps {
  onComplete?: (result: { score: number; level: number }) => void;
  onExit?: () => void;
}

// 3 مستويات: 3 خطوات → 4 خطوات → 5 خطوات (صعوبة تصاعدية)
const ROUTINES: Routine[] = [
  {
    title: "روتين الصباح",
    steps: [
      { emoji: "🛏️", label: "استيقظ من النوم" },
      { emoji: "🪥", label: "اغسل أسنانك" },
      { emoji: "🥣", label: "فطر" },
    ],
  },
  {
    title: "الاستعداد للمدرسة",
    steps: [
      { emoji: "🛏️", label: "استيقظ من النوم" },
      { emoji: "👕", label: "البس هدومك" },
      { emoji: "🥣", label: "فطر" },
      { emoji: "🎒", label: "احمل الشنطة" },
    ],
  },
  {
    title: "يوم كامل بره البيت",
    steps: [
      { emoji: "🪥", label: "اغسل أسنانك" },
      { emoji: "👕", label: "البس هدومك" },
      { emoji: "🎒", label: "احمل الشنطة" },
      { emoji: "🚌", label: "اركب الأتوبيس" },
      { emoji: "🏫", label: "روح المدرسة" },
    ],
  },
];

const POINTS_PER_LEVEL = 15;

function shuffledDifferentFrom(steps: Step[]): Step[] {
  let arr = [...steps];
  do {
    arr = [...steps].sort(() => Math.random() - 0.5);
  } while (arr.every((s, i) => s.label === steps[i].label));
  return arr;
}

export default function SequencingGame({ onComplete, onExit }: SequencingGameProps = {}) {
  const [state, setState] = useState<"start" | "playing" | "finished">("start");
  const [level, setLevel] = useState(1);
  const [order, setOrder] = useState<Step[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [hintIndex, setHintIndex] = useState<number | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const routine = ROUTINES[level - 1];

  useEffect(() => {
    return () => {
      if (hintTimer.current) clearTimeout(hintTimer.current);
    };
  }, []);

  function startLevel(lvl: number) {
    setOrder(shuffledDifferentFrom(ROUTINES[lvl - 1].steps));
    setSelected(null);
    setHintIndex(null);
  }

  function startGame() {
    setState("playing");
    setLevel(1);
    setScore(0);
    startLevel(1);
  }

  function isSolved(arr: Step[], correct: Step[]) {
    return arr.every((s, i) => s.label === correct[i].label);
  }

  function tapTile(index: number) {
    if (celebrate) return;
    if (selected === null) {
      setSelected(index);
      return;
    }
    if (selected === index) {
      setSelected(null);
      return;
    }
    const next = [...order];
    [next[selected], next[index]] = [next[index], next[selected]];
    setOrder(next);
    setSelected(null);
    setHintIndex(null);

    if (isSolved(next, routine.steps)) {
      const newScore = score + POINTS_PER_LEVEL;
      setScore(newScore);
      setCelebrate(true);
      setTimeout(() => {
        setCelebrate(false);
        if (level < ROUTINES.length) {
          const nextLevel = level + 1;
          setLevel(nextLevel);
          startLevel(nextLevel);
        } else {
          setState("finished");
          onComplete?.({ score: newScore, level: ROUTINES.length });
        }
      }, 1300);
    }
  }

  function showHint() {
    // التلميح: يبيّن أول خطوة غلط في مكانها الحالي، لمدة قصيرة
    const wrongIdx = order.findIndex((s, i) => s.label !== routine.steps[i].label);
    if (wrongIdx === -1) return;
    setHintIndex(wrongIdx);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHintIndex(null), 1400);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.bg,
        fontFamily: "'Tajawal', sans-serif",
        direction: "rtl",
        position: "relative",
      }}
    >
      <style>{`
        @keyframes seq-appear { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:translateY(0);} }
        @keyframes seq-pop { 0% { transform:scale(1);} 50% { transform:scale(1.08);} 100% { transform:scale(1);} }
        .seq-screen { animation: seq-appear 0.25s ease; }
        .seq-tile:active { transform: scale(0.96); }
        .seq-celebrate { animation: seq-pop 0.5s ease; }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation: none !important; transition: none !important; }
        }
      `}</style>

      {onExit && (
        <button
          onClick={onExit}
          aria-label="الرجوع إلى الألعاب"
          style={{
            position: "absolute", top: 16, right: 16, zIndex: 2,
            background: T.surface, border: `2px solid ${T.border}`, borderRadius: 999,
            padding: "8px 16px", cursor: "pointer", color: T.textMuted, fontWeight: 700,
            fontSize: 13, fontFamily: "inherit", boxShadow: `0 2px 8px ${T.shadow}`,
          }}
        >
          → رجوع
        </button>
      )}

      <div
        style={{
          position: "relative", zIndex: 1, maxWidth: 640, margin: "0 auto",
          padding: "28px 16px 48px", display: "flex", flexDirection: "column",
          alignItems: "center", gap: 20,
        }}
      >
        {state === "start" && (
          <div className="seq-screen" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 18, marginTop: 40 }}>
            <div
              style={{
                width: 64, height: 64, borderRadius: 18, background: T.secondary,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30,
                boxShadow: `0 8px 24px ${T.secondary}44`,
              }}
            >
              🧩
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 900, color: T.text, margin: 0 }}>رتّب الخطوات</h1>
            <p style={{ fontSize: 15, color: T.textMuted, maxWidth: 300, margin: 0, lineHeight: 1.7 }}>
              اضغط على خطوتين عشان تبدّل مكانهم، ورتّبهم صح
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
              {["3 مستويات", "تلميح متاح", `${POINTS_PER_LEVEL} نقطة للمستوى`].map((chip) => (
                <span key={chip} style={{ fontSize: 12, fontWeight: 700, color: T.secondary, background: T.secondaryBg, borderRadius: 999, padding: "6px 14px" }}>
                  {chip}
                </span>
              ))}
            </div>
            <button
              onClick={startGame}
              style={{
                marginTop: 8, padding: "14px 36px", borderRadius: 999, border: "none",
                background: T.secondary, color: "#fff", fontSize: 16, fontWeight: 800,
                cursor: "pointer", fontFamily: "inherit", boxShadow: `0 8px 22px ${T.secondary}44`,
              }}
            >
              ابدأ اللعب
            </button>
          </div>
        )}

        {state === "playing" && (
          <div className="seq-screen" style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <div
              style={{
                width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                background: T.surface, borderRadius: 18, padding: "14px 18px", boxShadow: `0 2px 10px ${T.shadow}`,
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 700 }}>{routine.title}</div>
                <div style={{ fontSize: 15, color: T.text, fontWeight: 900 }}>المستوى {level} / {ROUTINES.length}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 700 }}>النقاط</div>
                <div style={{ fontSize: 16, color: T.text, fontWeight: 900 }}>{score}</div>
              </div>
            </div>

            <p style={{ fontSize: 13, color: T.textMuted, margin: 0, textAlign: "center" }}>
              اضغط خطوتين عشان تبدّلهم، لحد ما الترتيب يبقى صح
            </p>

            <div
              className={celebrate ? "seq-celebrate" : ""}
              style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}
            >
              {order.map((step, i) => {
                const isSelected = selected === i;
                const isHint = hintIndex === i;
                return (
                  <button
                    key={`${step.label}-${i}`}
                    className="seq-tile"
                    onClick={() => tapTile(i)}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      border: `3px solid ${isSelected ? T.secondary : isHint ? T.primary : T.border}`,
                      borderRadius: 16, background: T.surface, padding: "12px 16px",
                      cursor: "pointer", fontFamily: "inherit", textAlign: "right",
                      boxShadow: isSelected ? `0 4px 14px ${T.secondary}33` : "none",
                    }}
                  >
                    <span
                      style={{
                        width: 30, height: 30, borderRadius: "50%", background: T.secondaryBg,
                        color: T.secondary, fontSize: 13, fontWeight: 900,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ fontSize: 26 }}>{step.emoji}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{step.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={showHint}
              style={{
                border: `2px solid ${T.border}`, background: "transparent", color: T.textMuted,
                borderRadius: 999, padding: "8px 20px", fontSize: 13, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              💡 تلميح
            </button>
          </div>
        )}

        {state === "finished" && (
          <div className="seq-screen" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginTop: 40 }}>
            <div style={{ fontSize: 48 }}>🏆</div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: T.text, margin: 0 }}>مبروك، رتّبت كل الروتينات!</h1>
            <div
              style={{
                background: T.surface, borderRadius: 16, padding: "16px 32px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              }}
            >
              <span style={{ fontSize: 30, fontWeight: 900, color: T.secondary }}>{score}</span>
              <span style={{ fontSize: 12, color: T.textMuted }}>نقطة من {ROUTINES.length * POINTS_PER_LEVEL}</span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={startGame}
                style={{
                  padding: "12px 28px", borderRadius: 999, border: "none",
                  background: T.secondary, color: "#fff", fontSize: 14, fontWeight: 800,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                العب تاني
              </button>
              {onExit && (
                <button
                  onClick={onExit}
                  style={{
                    padding: "12px 28px", borderRadius: 999, border: `2px solid ${T.border}`,
                    background: "transparent", color: T.textMuted, fontSize: 14, fontWeight: 800,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  رجوع للألعاب
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
