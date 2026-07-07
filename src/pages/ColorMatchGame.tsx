// src/pages/ColorMatchGame.tsx
// ============================================================
// لعبة "خمّن اللون" — تدريب على التمييز البصري للألوان
// (Visual Color Discrimination)
//
// الأساس العلمي: التمييز البصري هو حجر الأساس قبل أي مهارة
// تصنيفية أعقد (تصنيف الأشكال، الحروف، الأرقام). يُستخدم بكثرة
// في برامج ABA التأسيسية (Early Intervention) كخطوة أولى قبل
// الانتقال لمهارات المطابقة الأكثر تجريدًا.
//
// تعديل عن النسخة الأصلية: تمت إزالة استخدام window.alert()
// عند الإجابة الخطأ (كان يوقف اللعب بنافذة منبثقة مفاجئة تخالف
// مبدأ Sensory-Safety)، واستُبدل بتغذية راجعة هادئة داخل الشاشة
// نفسها، ودرجات الألوان خُفّفت قليلاً لتقليل حدة التشبع البصري.
//
// نفس نمط باقي الألعاب بالظبط: onComplete/onExit props،
// inline styles معتمدة على memoryTokens.
// ============================================================
import { useState } from "react";
import { memoryTokens as T } from "./theme";

interface Fruit {
  name: string;
  color: string;
  emoji: string;
}

interface ColorMatchGameProps {
  onComplete?: (result: { score: number; level: number }) => void;
  onExit?: () => void;
}

// درجات ألوان مخفّفة قليلاً عن الأسماء القياسية الحادة (red/blue..)
// مع الحفاظ على تمايز واضح بينها لضمان سهولة التمييز.
const FRUITS: Fruit[] = [
  { name: "بطيخ",   color: "#E86A5C", emoji: "🍉" },
  { name: "برتقال", color: "#EFA24C", emoji: "🍊" },
  { name: "موز",    color: "#EED26A", emoji: "🍌" },
  { name: "عنب",    color: "#9B7FC7", emoji: "🍇" },
  { name: "كيوي",   color: "#7FBF7A", emoji: "🥝" },
  { name: "توت",    color: "#6FA3D8", emoji: "🫐" },
];

const TOTAL_LEVELS = 10;
const POINTS_PER_LEVEL = 10;

export default function ColorMatchGame({ onComplete, onExit }: ColorMatchGameProps = {}) {
  const [state, setState] = useState<"start" | "playing" | "finished">("start");
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [target, setTarget] = useState<Fruit | null>(null);
  const [options, setOptions] = useState<Fruit[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [pickedColor, setPickedColor] = useState<string | null>(null);

  function startLevel() {
    const shuffled = [...FRUITS].sort(() => Math.random() - 0.5).slice(0, 3);
    const chosenTarget = shuffled[Math.floor(Math.random() * 3)];
    setOptions(shuffled);
    setTarget(chosenTarget);
    setFeedback(null);
    setPickedColor(null);
  }

  function startGame() {
    setState("playing");
    setLevel(1);
    setLives(3);
    setScore(0);
    startLevel();
  }

  function handleChoice(fruit: Fruit) {
    if (feedback || !target) return;
    setPickedColor(fruit.color);

    if (fruit.color === target.color) {
      const newScore = score + POINTS_PER_LEVEL;
      setFeedback("correct");
      setScore(newScore);
      setTimeout(() => {
        if (level < TOTAL_LEVELS) {
          setLevel((l) => l + 1);
          startLevel();
        } else {
          setState("finished");
          onComplete?.({ score: newScore, level: TOTAL_LEVELS });
        }
      }, 1000);
    } else {
      setFeedback("wrong");
      const remaining = lives - 1;
      setTimeout(() => {
        if (remaining <= 0) {
          setLives(0);
          setState("finished");
          onComplete?.({ score, level });
        } else {
          setLives(remaining);
          setFeedback(null);
          setPickedColor(null);
        }
      }, 1000);
    }
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
        @keyframes cm-appear { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:translateY(0);} }
        .cm-screen { animation: cm-appear 0.25s ease; }
        .cm-card:active { transform: scale(0.96); }
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
          <div className="cm-screen" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 18, marginTop: 40 }}>
            <div
              style={{
                width: 64, height: 64, borderRadius: 18, background: T.primary,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30,
                boxShadow: `0 8px 24px ${T.primary}44`,
              }}
            >
              🎨
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 900, color: T.text, margin: 0 }}>خمّن اللون</h1>
            <p style={{ fontSize: 15, color: T.textMuted, maxWidth: 300, margin: 0, lineHeight: 1.7 }}>
              هيظهرلك لون، اختار الفاكهة اللي لونها مطابق
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
              {["10 مستويات", "3 محاولات", `${POINTS_PER_LEVEL} نقط للمستوى`].map((chip) => (
                <span key={chip} style={{ fontSize: 12, fontWeight: 700, color: T.primary, background: T.primaryBg, borderRadius: 999, padding: "6px 14px" }}>
                  {chip}
                </span>
              ))}
            </div>
            <button
              onClick={startGame}
              style={{
                marginTop: 8, padding: "14px 36px", borderRadius: 999, border: "none",
                background: T.primary, color: "#fff", fontSize: 16, fontWeight: 800,
                cursor: "pointer", fontFamily: "inherit", boxShadow: `0 8px 22px ${T.primary}44`,
              }}
            >
              ابدأ اللعب
            </button>
          </div>
        )}

        {state === "playing" && target && (
          <div className="cm-screen" style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <div
              style={{
                width: "100%", display: "flex", justifyContent: "space-around",
                background: T.surface, borderRadius: 18, padding: "14px 10px", boxShadow: `0 2px 10px ${T.shadow}`,
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 700 }}>المستوى</div>
                <div style={{ fontSize: 16, color: T.text, fontWeight: 900 }}>{level} / {TOTAL_LEVELS}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 700 }}>النقاط</div>
                <div style={{ fontSize: 16, color: T.text, fontWeight: 900 }}>{score}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 700, marginBottom: 4 }}>المحاولات</div>
                <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                  {[0, 1, 2].map((i) => (
                    <span key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: i >= lives ? T.border : T.success }} />
                  ))}
                </div>
              </div>
            </div>

            <p style={{ fontSize: 13, color: T.textMuted, margin: 0, textAlign: "center" }}>
              اختار الفاكهة اللي لونها زي المربع ده
            </p>

            <div
              style={{
                width: 110, height: 110, borderRadius: 20, background: target.color,
                boxShadow: `0 8px 24px ${target.color}55`, border: `4px solid ${T.surface}`,
              }}
            />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, width: "100%" }}>
              {options.map((fruit) => {
                const isPicked = pickedColor === fruit.color;
                const borderColor = isPicked
                  ? feedback === "correct" ? T.success : T.primary
                  : T.border;
                return (
                  <button
                    key={fruit.name}
                    className="cm-card"
                    onClick={() => handleChoice(fruit)}
                    disabled={Boolean(feedback)}
                    style={{
                      position: "relative", border: `3px solid ${borderColor}`, borderRadius: 16,
                      background: T.surface, cursor: feedback ? "default" : "pointer",
                      padding: "20px 8px", display: "flex", flexDirection: "column",
                      alignItems: "center", gap: 6, fontFamily: "inherit",
                    }}
                  >
                    <span style={{ fontSize: 40 }}>{fruit.emoji}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: T.text }}>{fruit.name}</span>
                    {isPicked && feedback && (
                      <span
                        style={{
                          position: "absolute", top: 6, left: 6, fontSize: 10, fontWeight: 800,
                          padding: "2px 8px", borderRadius: 999, color: "#fff",
                          background: feedback === "correct" ? T.success : T.primary,
                        }}
                      >
                        {feedback === "correct" ? "صح ✓" : "حاول تاني"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {state === "finished" && (
          <div className="cm-screen" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginTop: 40 }}>
            <div style={{ fontSize: 48 }}>{score >= 50 ? "🏆" : "🌟"}</div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: T.text, margin: 0 }}>
              {score >= 50 ? "مبروك، كسبت!" : "أحسنت، حاول تاني!"}
            </h1>
            <div style={{ background: T.surface, borderRadius: 16, padding: "16px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 30, fontWeight: 900, color: T.primary }}>{score}</span>
              <span style={{ fontSize: 12, color: T.textMuted }}>نقطة من {TOTAL_LEVELS * POINTS_PER_LEVEL}</span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={startGame}
                style={{ padding: "12px 28px", borderRadius: 999, border: "none", background: T.primary, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}
              >
                العب تاني
              </button>
              {onExit && (
                <button
                  onClick={onExit}
                  style={{ padding: "12px 28px", borderRadius: 999, border: `2px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}
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
