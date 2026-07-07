// src/pages/MusicGame.tsx
// ============================================================
// لعبة "اتبع اللحن" — تدريب الذاكرة السمعية-التسلسلية
// (Auditory Sequential Memory)
//
// الأساس العلمي: القدرة على تذكر تتابع من الأصوات بالترتيب
// الصحيح هي مهارة تأسيسية قبل فهم التعليمات الشفهية متعددة
// الخطوات (Multi-Step Verbal Instructions) — وهي من أكثر
// التحديات شيوعاً لدى أطفال طيف التوحد.
//
// قرار سلامة حسية مقصود: النغمات الأربع مأخوذة من السلم
// الخماسي (Pentatonic Scale) — وهو سلم موسيقي تكون فيه أي
// مجموعة نغمات متناغمة معاً بالتعريف، فحتى لو الطفل ضغط
// بترتيب عشوائي، الصوت الناتج مريح وليس نشازاً. الأصوات مولّدة
// برمجياً (Web Audio API) بتلاشٍ ناعم (Fade) لتفادي أي صوت
// مفاجئ حاد، ومفيش نظام محاولات/Lives — تكرار حر بلا ضغط،
// بنفس فلسفة لعبة "تتبّع الخطوط".
//
// نفس نمط باقي الألعاب: onComplete/onExit props، inline styles
// معتمدة على memoryTokens.
// ============================================================
import { useState, useRef, useCallback } from "react";
import { memoryTokens as T } from "./theme";

interface MusicGameProps {
  onComplete?: (result: { score: number; level: number }) => void;
  onExit?: () => void;
}

// سلم خماسي (C D E G A) — أي تتابع منها يظل متناغماً سمعياً
const PADS = [
  { id: 0, note: "دو", freq: 261.63, color: T.primary },
  { id: 1, note: "ري", freq: 293.66, color: T.secondary },
  { id: 2, note: "مي", freq: 329.63, color: T.success },
  { id: 3, note: "صول", freq: 392.0, color: "#5C9DD6" },
];

const LEVEL_LENGTHS = [3, 4, 5]; // 3 مستويات صعوبة تصاعدية
const POINTS_PER_LEVEL = 20;

export default function MusicGame({ onComplete, onExit }: MusicGameProps = {}) {
  const [state, setState] = useState<"start" | "listening" | "playing" | "result" | "finished">("start");
  const [level, setLevel] = useState(1);
  const [totalScore, setTotalScore] = useState(0);
  const [sequence, setSequence] = useState<number[]>([]);
  const [userInput, setUserInput] = useState<number[]>([]);
  const [activePad, setActivePad] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "retry" | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);

  function getAudioContext() {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
  }

  // نغمة ناعمة بتلاشٍ تدريجي (Fade In/Out) — لا صوت مفاجئ حاد
  function playTone(freq: number, duration = 480) {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.04);
    gain.gain.linearRampToValueAtTime(0, now + duration / 1000);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration / 1000 + 0.02);
  }

  async function playSequence(seq: number[]) {
    setState("listening");
    setUserInput([]);
    for (let i = 0; i < seq.length; i++) {
      await new Promise((r) => setTimeout(r, 550));
      setActivePad(seq[i]);
      playTone(PADS[seq[i]].freq);
      await new Promise((r) => setTimeout(r, 420));
      setActivePad(null);
    }
    setState("playing");
  }

  function startLevel(lvl: number) {
    const length = LEVEL_LENGTHS[lvl - 1];
    const seq = Array.from({ length }, () => Math.floor(Math.random() * PADS.length));
    setSequence(seq);
    setFeedback(null);
    playSequence(seq);
  }

  function startGame() {
    setLevel(1);
    setTotalScore(0);
    startLevel(1);
  }

  const handlePadTap = useCallback((padId: number) => {
    if (state !== "playing") return;
    playTone(PADS[padId].freq, 300);
    setActivePad(padId);
    setTimeout(() => setActivePad(null), 200);

    const next = [...userInput, padId];
    setUserInput(next);

    const idx = next.length - 1;
    if (padId !== sequence[idx]) {
      // إجابة غير مطابقة: نعيد سماع نفس التتابع من غير أي عقاب
      setFeedback("retry");
      setState("result");
      return;
    }

    if (next.length === sequence.length) {
      const earned = POINTS_PER_LEVEL;
      const newTotal = totalScore + earned;
      setTotalScore(newTotal);
      setFeedback("correct");
      setState("result");
      setTimeout(() => {
        if (level < LEVEL_LENGTHS.length) {
          const nextLvl = level + 1;
          setLevel(nextLvl);
          startLevel(nextLvl);
        } else {
          setState("finished");
          onComplete?.({ score: newTotal, level: LEVEL_LENGTHS.length });
        }
      }, 1200);
    }
  }, [state, userInput, sequence, level, totalScore]);

  function retrySameLevel() {
    startLevel(level);
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Tajawal', sans-serif", direction: "rtl", position: "relative" }}>
      <style>{`
        @keyframes mg-appear { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:translateY(0);} }
        @keyframes mg-glow { 0%,100% { transform:scale(1); } 50% { transform:scale(1.08); } }
        .mg-screen { animation: mg-appear 0.25s ease; }
        .mg-pad-active { animation: mg-glow 0.35s ease; }
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

      <div style={{ position: "relative", zIndex: 1, maxWidth: 420, margin: "0 auto", padding: "28px 16px 48px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        {state === "start" && (
          <div className="mg-screen" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 18, marginTop: 40 }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: T.secondary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, boxShadow: `0 8px 24px ${T.secondary}44` }}>
              🎵
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 900, color: T.text, margin: 0 }}>اتبع اللحن</h1>
            <p style={{ fontSize: 15, color: T.textMuted, maxWidth: 280, margin: 0, lineHeight: 1.7 }}>
              استمع للنغمات، وكرّرها بنفس الترتيب
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
              {["3 مستويات", "أصوات هادئة ومتناغمة", `${POINTS_PER_LEVEL} نقطة للمستوى`].map((chip) => (
                <span key={chip} style={{ fontSize: 12, fontWeight: 700, color: T.secondary, background: T.secondaryBg, borderRadius: 999, padding: "6px 14px" }}>
                  {chip}
                </span>
              ))}
            </div>
            <button
              onClick={startGame}
              style={{ marginTop: 8, padding: "14px 36px", borderRadius: 999, border: "none", background: T.secondary, color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", boxShadow: `0 8px 22px ${T.secondary}44` }}
            >
              ابدأ اللعب
            </button>
          </div>
        )}

        {(state === "listening" || state === "playing" || state === "result") && (
          <div className="mg-screen" style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: T.surface, borderRadius: 18, padding: "14px 18px", boxShadow: `0 2px 10px ${T.shadow}` }}>
              <div>
                <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 700 }}>المستوى</div>
                <div style={{ fontSize: 15, color: T.text, fontWeight: 900 }}>{level} / {LEVEL_LENGTHS.length}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 700 }}>النقاط</div>
                <div style={{ fontSize: 16, color: T.text, fontWeight: 900 }}>{totalScore}</div>
              </div>
            </div>

            <p style={{ fontSize: 13, color: T.textMuted, margin: 0, textAlign: "center" }}>
              {state === "listening" && "استمع كويس للنغمات..."}
              {state === "playing" && "دلوقتي كرّر نفس الترتيب"}
              {state === "result" && feedback === "correct" && "برافو! ترتيب مظبوط"}
              {state === "result" && feedback === "retry" && "محاولة حلوة، بس استمع تاني وحاول"}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, width: "100%" }}>
              {PADS.map((pad) => {
                const isActive = activePad === pad.id;
                return (
                  <button
                    key={pad.id}
                    onClick={() => handlePadTap(pad.id)}
                    disabled={state !== "playing"}
                    className={isActive ? "mg-pad-active" : ""}
                    style={{
                      aspectRatio: "1", border: "none", borderRadius: 20,
                      background: pad.color, opacity: isActive ? 1 : 0.85,
                      boxShadow: isActive ? `0 0 0 6px ${pad.color}33` : `0 4px 14px ${pad.color}33`,
                      cursor: state === "playing" ? "pointer" : "default",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 20, fontWeight: 900, color: "#fff", fontFamily: "inherit",
                    }}
                  >
                    {pad.note}
                  </button>
                );
              })}
            </div>

            {state === "result" && feedback === "retry" && (
              <button
                onClick={retrySameLevel}
                style={{ padding: "10px 28px", borderRadius: 999, border: "none", background: T.secondary, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}
              >
                استمع تاني
              </button>
            )}
          </div>
        )}

        {state === "finished" && (
          <div className="mg-screen" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginTop: 40 }}>
            <div style={{ fontSize: 48 }}>🏆</div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: T.text, margin: 0 }}>مبروك، خلّصت كل الألحان!</h1>
            <div style={{ background: T.surface, borderRadius: 16, padding: "16px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 30, fontWeight: 900, color: T.secondary }}>{totalScore}</span>
              <span style={{ fontSize: 12, color: T.textMuted }}>نقطة من {LEVEL_LENGTHS.length * POINTS_PER_LEVEL}</span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={startGame} style={{ padding: "12px 28px", borderRadius: 999, border: "none", background: T.secondary, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                العب تاني
              </button>
              {onExit && (
                <button onClick={onExit} style={{ padding: "12px 28px", borderRadius: 999, border: `2px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
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
