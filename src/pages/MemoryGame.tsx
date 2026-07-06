import { useState, useEffect, useCallback, useRef } from "react";
import { memoryTokens as T } from "./theme";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

type Difficulty = "easy" | "medium" | "hard";

interface BlobConfig {
  w: number; h: number; bg: string;
  top: string; bottom: string; right: string; left: string; opacity: number;
}

interface MemoryGameProps {
  /** Called once the board is solved, so the Kids Zone can award coins/stars. */
  onComplete?: (result: { moves: number; time: number }) => void;
  /** Renders a back control that returns to the games grid. */
  onExit?: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const DIFFICULTY_CONFIG: Record<Difficulty, { pairs: number; cols: number; label: string }> = {
  easy:   { pairs: 3,  cols: 3, label: "سهل 😊" },
  medium: { pairs: 5,  cols: 5, label: "متوسط 🤔" },
  hard:   { pairs: 10, cols: 5, label: "صعب 🔥" },
};

const EMOJI_POOL: string[] = [
  "🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼",
  "🐨","🐯","🦁","🐸","🦋","🐝","🦄","🐙",
  "🦀","🐡","🦜","🦞","🦩","🐳","🦭","🦕",
  "🌸","🌻","🍎","🍓","🍕","🎸","🚀","🎯",
];

const FLIP_BACK_DELAY = 900;

// ─── Utils ────────────────────────────────────────────────────────────────────
// Fisher–Yates: an unbiased shuffle (Array.sort with a random comparator is not).
function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function buildDeck(pairs: number): Card[] {
  const emojis = shuffle(EMOJI_POOL).slice(0, pairs);
  return shuffle([...emojis, ...emojis]).map((emoji, i) => ({
    id: i, emoji, isFlipped: false, isMatched: false,
  }));
}

function formatTime(s: number): string {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

// ─── useMemoryGame Hook ───────────────────────────────────────────────────────
function useMemoryGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [cards, setCards]           = useState<Card[]>(() => buildDeck(3));
  const [flipped, setFlipped]       = useState<number[]>([]);
  const [moves, setMoves]           = useState(0);
  const [time, setTime]             = useState(0);
  const [running, setRunning]       = useState(false);
  const [won, setWon]               = useState(false);
  const [checking, setChecking]     = useState(false);

  const matched = cards.filter(c => c.isMatched).length / 2;
  const total   = cards.length / 2;

  useEffect(() => {
    if (!running || won) return;
    const id = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [running, won]);

  useEffect(() => {
    if (cards.length > 0 && cards.every(c => c.isMatched)) {
      setWon(true); setRunning(false);
    }
  }, [cards]);

  const resetGame = useCallback((diff: Difficulty = difficulty) => {
    setCards(buildDeck(DIFFICULTY_CONFIG[diff].pairs));
    setFlipped([]); setMoves(0); setTime(0);
    setRunning(false); setWon(false); setChecking(false);
  }, [difficulty]);

  const handleCardClick = useCallback((id: number) => {
    if (!running) setRunning(true);
    if (checking || flipped.length === 2) return;

    const newFlipped = [...flipped, id];
    setCards(prev => prev.map(c => c.id === id ? { ...c, isFlipped: true } : c));
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      setChecking(true);
      const [a, b] = newFlipped;
      const cardA  = cards.find(c => c.id === a)!;
      const cardB  = cards.find(c => c.id === b)!;
      setTimeout(() => {
        if (cardA.emoji === cardB.emoji) {
          setCards(prev => prev.map(c =>
            c.id === a || c.id === b ? { ...c, isMatched: true, isFlipped: false } : c
          ));
        } else {
          setCards(prev => prev.map(c =>
            c.id === a || c.id === b ? { ...c, isFlipped: false } : c
          ));
        }
        setFlipped([]); setChecking(false);
      }, FLIP_BACK_DELAY);
    }
  }, [flipped, checking, cards, running]);

  const handleDifficulty = useCallback((d: Difficulty) => {
    setDifficulty(d); resetGame(d);
  }, [resetGame]);

  return {
    cards, difficulty, won, checking,
    stats: { moves, time, matched, total },
    handleCardClick, handleDifficulty, resetGame,
  };
}

// ─── Card Tile ────────────────────────────────────────────────────────────────
function CardTile({ card, onClick, disabled }: {
  card: Card;
  onClick: () => void;
  disabled: boolean;
}) {
  const visible   = card.isFlipped || card.isMatched;
  const clickable = !disabled && !card.isFlipped && !card.isMatched;

  // A real <button> makes every card keyboard-focusable and announces state
  // to assistive tech — essential for children using switch access or a reader.
  const label = card.isMatched
    ? `بطاقة متطابقة: ${card.emoji}`
    : card.isFlipped
      ? `بطاقة مكشوفة: ${card.emoji}`
      : "بطاقة مقلوبة، اضغط لقلبها";

  return (
    <button
      type="button"
      onClick={() => clickable && onClick()}
      disabled={!clickable}
      aria-label={label}
      style={{
        perspective: "700px", cursor: clickable ? "pointer" : "default",
        aspectRatio: "1", border: "none", background: "transparent",
        padding: 0, fontFamily: "inherit",
      }}
    >
      <div style={{
        position: "relative", width: "100%", height: "100%",
        transformStyle: "preserve-3d",
        transition: "transform 0.42s cubic-bezier(.4,1.6,.6,1)",
        transform: visible ? "rotateY(180deg)" : "rotateY(0deg)",
      }}>
        {/* Back */}
        <div style={{
          position: "absolute", inset: 0,
          backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
          borderRadius: 14, background: T.surface, border: `2px solid ${T.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 2px 8px ${T.shadow}`, userSelect: "none",
        }}>
          <span style={{
            width: "50%", height: "50%", borderRadius: "50%",
            background: `linear-gradient(135deg, ${T.primaryBg}, ${T.secondaryBg})`,
            border: `2px dashed ${T.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "clamp(12px, 2vw, 18px)", color: T.textMuted, fontWeight: 700,
          }}>?</span>
        </div>
        {/* Front */}
        <div style={{
          position: "absolute", inset: 0,
          backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
          transform: "rotateY(180deg)", borderRadius: 14,
          background: card.isMatched ? T.successBg : T.primaryBg,
          border: `2px solid ${card.isMatched ? T.success : T.primaryLight}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "clamp(20px, 4vw, 36px)",
          boxShadow: card.isMatched
            ? "0 4px 16px rgba(91,184,138,0.22)"
            : "0 4px 16px rgba(233,130,76,0.15)",
          userSelect: "none",
        }}>{card.emoji}</div>
      </div>
    </button>
  );
}

// ─── Win Modal ────────────────────────────────────────────────────────────────
function WinModal({ moves, time, onRestart }: {
  moves: number;
  time: number;
  onRestart: () => void;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);

  // Move focus into the dialog and let Enter/Esc restart from the keyboard.
  useEffect(() => {
    btnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") onRestart();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onRestart]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="مبروك، أنجزت اللعبة"
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(44,44,58,0.45)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div style={{
        background: T.surface, borderRadius: 28, padding: "40px 44px",
        textAlign: "center", maxWidth: 360, width: "90%",
        boxShadow: `0 32px 80px ${T.shadowMd}`, border: `1px solid ${T.border}`,
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%", background: T.primaryBg,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 40, margin: "0 auto 20px", border: `2px solid ${T.primaryLight}`,
        }}>🏆</div>
        <h2 style={{ margin: "0 0 8px", fontSize: 26, fontWeight: 800, color: T.text }}>
          مبروك! أنجزتها! 🎉
        </h2>
        <p style={{ color: T.textMuted, margin: "0 0 24px", fontSize: 15, lineHeight: 1.7 }}>
          خلصت في <strong style={{ color: T.primary }}>{moves} خطوة</strong> وفي{" "}
          <strong style={{ color: T.secondary }}>{formatTime(time)}</strong>
        </p>
        <button ref={btnRef} onClick={onRestart} style={{
          width: "100%", padding: "14px", borderRadius: 14, border: "none",
          background: T.primary, color: "#fff", fontSize: 17, fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit",
          boxShadow: "0 6px 20px rgba(233,130,76,0.35)",
        }}>العبها تاني! 🔄</button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MemoryGame({ onComplete, onExit }: MemoryGameProps = {}) {
  const {
    cards, stats, difficulty, won, checking,
    handleCardClick, handleDifficulty, resetGame,
  } = useMemoryGame();

  const { moves, time, matched, total } = stats;
  const { cols } = DIFFICULTY_CONFIG[difficulty];
  const progress = total > 0 ? (matched / total) * 100 : 0;

  // Report the win upward exactly once so rewards aren't granted twice.
  useEffect(() => {
    if (won) onComplete?.({ moves, time });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [won]);

  const blobs: BlobConfig[] = [
    { w:300, h:300, bg:T.primaryBg,   top:"-60px", bottom:"auto", right:"-60px", left:"auto",  opacity:.85 },
    { w:240, h:240, bg:T.secondaryBg, top:"auto",  bottom:"40px", right:"auto",  left:"-50px", opacity:.7  },
    { w:160, h:160, bg:"#E8F4FD",     top:"38%",   bottom:"auto", right:"65%",   left:"auto",  opacity:.5  },
  ];

  const statItems = [
    { icon: "⏱", label: "الوقت",    value: formatTime(time), color: T.secondary },
    { icon: "👣", label: "الخطوات",  value: String(moves),    color: T.primary   },
    { icon: "✅", label: "اتطابقوا", value: `${matched}/${total}`, color: T.success },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes floatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .game-root  { animation: fadeUp 0.4s ease both; }
        .diff-btn:hover  { opacity: 0.8; }
        .reset-btn:hover { border-color: ${T.primary} !important; color: ${T.primary} !important; }
        .stat-box   { transition: transform 0.2s; }
        .stat-box:hover { transform: translateY(-2px); }
        button:active   { transform: scale(0.96) !important; }
        /* Sensory safety: honor the OS "reduce motion" setting everywhere. */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation: none !important; transition: none !important; }
        }
      `}</style>

      <div style={{
        minHeight: "100vh", background: T.bg,
        fontFamily: "'Tajawal', sans-serif", direction: "rtl",
        position: "relative", overflow: "hidden",
      }}>
        {/* BG blobs */}
        {blobs.map((b, i) => (
          <div key={i} aria-hidden="true" style={{
            position: "absolute", borderRadius: "50%", filter: "blur(55px)",
            pointerEvents: "none", zIndex: 0,
            width: b.w, height: b.h, background: b.bg,
            top: b.top, bottom: b.bottom, right: b.right, left: b.left, opacity: b.opacity,
          }}/>
        ))}

        {onExit && (
          <button onClick={onExit} className="reset-btn" aria-label="الرجوع إلى الألعاب" style={{
            position: "absolute", top: 16, right: 16, zIndex: 2,
            background: T.surface, border: `2px solid ${T.border}`, borderRadius: 999,
            padding: "8px 16px", cursor: "pointer", color: T.textMuted,
            fontWeight: 700, fontSize: 13, fontFamily: "inherit",
            boxShadow: `0 2px 8px ${T.shadow}`,
          }}>→ رجوع</button>
        )}

        <div className="game-root" style={{
          position: "relative", zIndex: 1, maxWidth: 700, margin: "0 auto",
          padding: "28px 16px 48px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
        }}>

          {/* Title */}
          <div style={{ textAlign: "center", animation: "floatY 4s ease-in-out infinite" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: T.surface, borderRadius: 999, padding: "6px 18px",
              border: `1px solid ${T.border}`, boxShadow: `0 2px 10px ${T.shadow}`, marginBottom: 14,
            }}>
              <span style={{ fontSize: 18 }}>🧠</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.textMuted }}>لعبة الذاكرة</span>
            </div>
            <h1 style={{ fontSize: "clamp(24px, 5.5vw, 38px)", fontWeight: 900, color: T.text, lineHeight: 1.3 }}>
              هل تقدر <span style={{ color: T.primary }}>تتذكرهم</span> كلهم؟ 🎴
            </h1>
          </div>

          {/* Difficulty */}
          <div role="group" aria-label="مستوى الصعوبة" style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map(d => (
              <button key={d} className="diff-btn" onClick={() => handleDifficulty(d)}
                aria-pressed={difficulty === d} style={{
                padding: "7px 18px", borderRadius: 999, fontFamily: "inherit",
                border: difficulty === d ? `2px solid ${T.primary}` : `2px solid ${T.border}`,
                background: difficulty === d ? T.primaryBg : T.surface,
                color: difficulty === d ? T.primary : T.textMuted,
                fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all 0.2s",
              }}>{DIFFICULTY_CONFIG[d].label}</button>
            ))}
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 10, width: "100%", justifyContent: "center", flexWrap: "wrap" }}>
            {statItems.map(({ icon, label, value, color }) => (
              <div key={label} className="stat-box" style={{
                background: T.surface, borderRadius: 16, padding: "12px 18px",
                textAlign: "center", border: `1px solid ${T.border}`,
                boxShadow: `0 2px 8px ${T.shadow}`, minWidth: 84,
              }}>
                <div style={{ fontSize: 18, marginBottom: 2 }}>{icon}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{label}</div>
              </div>
            ))}
            <button className="reset-btn" onClick={() => resetGame()} aria-label="إعادة اللعبة" style={{
              background: T.surface, border: `2px solid ${T.border}`, borderRadius: 16,
              padding: "10px 16px", cursor: "pointer", color: T.textMuted,
              fontWeight: 700, fontSize: 12, fontFamily: "inherit",
              boxShadow: `0 2px 8px ${T.shadow}`, transition: "all 0.2s",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            }}>
              <span style={{ fontSize: 20 }}>🔄</span>إعادة
            </button>
          </div>

          {/* Progress */}
          <div style={{ width: "100%", maxWidth: 540 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
              <span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>التقدم</span>
              <span style={{ fontSize: 13, color: T.primary, fontWeight: 700 }}>{Math.round(progress)}%</span>
            </div>
            <div style={{ height: 10, background: T.border, borderRadius: 999, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${progress}%`,
                background: `linear-gradient(90deg, ${T.primary}, ${T.primaryLight})`,
                borderRadius: 999, transition: "width 0.5s cubic-bezier(.4,1.6,.6,1)",
              }}/>
            </div>
          </div>

          {/* Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: "clamp(8px, 1.4vw, 14px)",
            width: "100%",
            maxWidth: Math.min(cols * 90 + (cols - 1) * 14, 660),
            background: T.surface, borderRadius: 24,
            padding: "clamp(12px, 2.5vw, 20px)",
            border: `1px solid ${T.border}`,
            boxShadow: `0 4px 24px ${T.shadow}`,
          }}>
            {cards.map(card => (
              <CardTile
                key={card.id}
                card={card}
                onClick={() => handleCardClick(card.id)}
                disabled={checking || won}
              />
            ))}
          </div>

          {!won && (
            <p style={{ fontSize: 13, color: T.textMuted, textAlign: "center", fontWeight: 500 }}>
              اقلب كارتين عشان تلاقي التوأم 🎯
            </p>
          )}

        </div>
      </div>

      {won && <WinModal moves={moves} time={time} onRestart={() => resetGame()} />}
    </>
  );
}
