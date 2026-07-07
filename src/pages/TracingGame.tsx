// src/pages/TracingGame.tsx
// ============================================================
// لعبة "تتبّع الخطوط" — تدريب المهارات الحركية الدقيقة
// (Fine Motor Precision / Pre-Writing Skills)
//
// الأساس العلمي: تتبّع الأشكال بالإصبع هو تمرين قياسي في العلاج
// الوظيفي (Occupational Therapy) لتقوية التحكم في العضلات
// الدقيقة والتناسق البصري-الحركي (Visual-Motor Coordination) —
// وهو أساس ضروري قبل تعلّم الإمساك بالقلم والكتابة.
//
// آلية اللعب: مسار مرسوم (SVG) بخط منقّط خفيف، الطفل يتتبّعه
// بإصبعه/الماوس، وكل ما لمس المسار بدقة كافية بيتلوّن باللون
// الأخضر. الدقة بتتحسب كنسبة النقاط اللي اتلمست من إجمالي المسار.
//
// ⚠️ قرار تصميمي مقصود: مفيش نظام "محاولات/Lives" هنا، بعكس
// باقي الألعاب — التدريب الحركي محتاج تكرار حر من غير إحساس
// "فشل"، فالطفل يقدر يعيد المحاولة على قد ما يحتاج.
//
// نفس نمط باقي الألعاب: onComplete/onExit props، inline styles
// معتمدة على memoryTokens.
// ============================================================
import { useState, useRef, useCallback } from "react";
import { memoryTokens as T } from "./theme";

interface TracingGameProps {
  onComplete?: (result: { score: number; level: number }) => void;
  onExit?: () => void;
}

// كل مستوى: مسار SVG (path d) + عدد نقاط العينة للتحقق من الدقة.
// الصعوبة تتصاعد من خط بسيط لدايرة لنجمة (تعقيد الانحناءات).
const LEVELS = [
  { title: "خط مستقيم", path: "M 30 100 L 170 100", samples: 40 },
  { title: "دايرة",     path: "M 100 40 A 60 60 0 1 1 99.9 40", samples: 70 },
  { title: "نجمة",       path: "M 100 25 L 118 78 L 175 78 L 129 111 L 147 165 L 100 132 L 53 165 L 71 111 L 25 78 L 82 78 Z", samples: 90 },
];

const TOUCH_TOLERANCE = 14; // px في نظام إحداثيات الـ viewBox (200x200)
const SUCCESS_THRESHOLD = 55; // % دقة يعتبر عندها المسار "مكتمل"
const POINTS_PER_LEVEL = 20;

function sampleSvgPath(pathEl: SVGPathElement, count: number) {
  const total = pathEl.getTotalLength();
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= count; i++) {
    const p = pathEl.getPointAtLength((total * i) / count);
    points.push({ x: p.x, y: p.y });
  }
  return points;
}

export default function TracingGame({ onComplete, onExit }: TracingGameProps = {}) {
  const [state, setState] = useState<"start" | "tracing" | "result" | "finished">("start");
  const [level, setLevel] = useState(1);
  const [totalScore, setTotalScore] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [userStroke, setUserStroke] = useState<{ x: number; y: number }[]>([]);
  const [touchedSet, setTouchedSet] = useState<Set<number>>(new Set());
  const [isDrawing, setIsDrawing] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const samplePointsRef = useRef<{ x: number; y: number }[]>([]);

  const currentLevel = LEVELS[level - 1];

  function toSvgPoint(clientX: number, clientY: number) {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const transformed = pt.matrixTransform(ctm.inverse());
    return { x: transformed.x, y: transformed.y };
  }

  function startLevel(lvl: number) {
    setUserStroke([]);
    setTouchedSet(new Set());
    setAccuracy(0);
    setState("tracing");
    // نأخذ عينة المسار بعد الرسم في الـ DOM
    requestAnimationFrame(() => {
      if (pathRef.current) {
        samplePointsRef.current = sampleSvgPath(pathRef.current, LEVELS[lvl - 1].samples);
      }
    });
  }

  function startGame() {
    setLevel(1);
    setTotalScore(0);
    startLevel(1);
  }

  const handlePointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    const p = toSvgPoint(e.clientX, e.clientY);
    setUserStroke([p]);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawing) return;
    const p = toSvgPoint(e.clientX, e.clientY);
    setUserStroke((prev) => [...prev, p]);

    // فحص القرب من نقاط العينة، وتحديث المسار "الملموس"
    setTouchedSet((prev) => {
      const next = new Set(prev);
      samplePointsRef.current.forEach((sp, idx) => {
        const dist = Math.hypot(sp.x - p.x, sp.y - p.y);
        if (dist <= TOUCH_TOLERANCE) next.add(idx);
      });
      return next;
    });
  }, [isDrawing]);

  function finishStroke() {
    setIsDrawing(false);
    const total = samplePointsRef.current.length || 1;
    const acc = Math.round((touchedSet.size / total) * 100);
    setAccuracy(acc);
    setState("result");
  }

  function retryLevel() {
    startLevel(level);
  }

  function nextLevel() {
    const earned = Math.round((accuracy / 100) * POINTS_PER_LEVEL);
    const newTotal = totalScore + earned;
    setTotalScore(newTotal);
    if (level < LEVELS.length) {
      const nextLvl = level + 1;
      setLevel(nextLvl);
      startLevel(nextLvl);
    } else {
      setState("finished");
      onComplete?.({ score: newTotal, level: LEVELS.length });
    }
  }

  const strokePoints = userStroke.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Tajawal', sans-serif", direction: "rtl", position: "relative" }}>
      <style>{`
        @keyframes tr-appear { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:translateY(0);} }
        .tr-screen { animation: tr-appear 0.25s ease; }
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

      <div style={{ position: "relative", zIndex: 1, maxWidth: 480, margin: "0 auto", padding: "28px 16px 48px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        {state === "start" && (
          <div className="tr-screen" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 18, marginTop: 40 }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: T.secondary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, boxShadow: `0 8px 24px ${T.secondary}44` }}>
              ✏️
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 900, color: T.text, margin: 0 }}>تتبّع الخطوط</h1>
            <p style={{ fontSize: 15, color: T.textMuted, maxWidth: 280, margin: 0, lineHeight: 1.7 }}>
              تابع الخط المنقّط بإصبعك من الأول للآخر
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
              {["3 مستويات", "من غير محاولات محدودة", `${POINTS_PER_LEVEL} نقطة للمستوى`].map((chip) => (
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

        {state === "tracing" && (
          <div className="tr-screen" style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: T.surface, borderRadius: 18, padding: "14px 18px", boxShadow: `0 2px 10px ${T.shadow}` }}>
              <div>
                <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 700 }}>{currentLevel.title}</div>
                <div style={{ fontSize: 15, color: T.text, fontWeight: 900 }}>المستوى {level} / {LEVELS.length}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 700 }}>النقاط</div>
                <div style={{ fontSize: 16, color: T.text, fontWeight: 900 }}>{totalScore}</div>
              </div>
            </div>

            <p style={{ fontSize: 13, color: T.textMuted, margin: 0, textAlign: "center" }}>
              حط إصبعك على أول الخط واتبعه لحد ما تخلص
            </p>

            <svg
              ref={svgRef}
              viewBox="0 0 200 200"
              width="100%"
              style={{
                maxWidth: 320, aspectRatio: "1", background: T.surface, borderRadius: 20,
                boxShadow: `0 2px 12px ${T.shadow}`, touchAction: "none", cursor: "pointer",
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={finishStroke}
              onPointerLeave={() => isDrawing && finishStroke()}
            >
              {/* المسار الإرشادي المنقّط */}
              <path
                ref={pathRef}
                d={currentLevel.path}
                fill="none"
                stroke={T.border}
                strokeWidth={6}
                strokeDasharray="2 8"
                strokeLinecap="round"
              />
              {/* نقاط البداية والنهاية */}
              <circle cx={0} cy={0} r={0} />
              {/* خط المستخدم الفعلي */}
              {userStroke.length > 1 && (
                <polyline
                  points={strokePoints}
                  fill="none"
                  stroke={T.success}
                  strokeWidth={7}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.85}
                />
              )}
            </svg>

            <button
              onClick={() => { if (userStroke.length > 2) finishStroke(); }}
              disabled={userStroke.length <= 2}
              style={{
                border: "none", background: userStroke.length > 2 ? T.secondary : T.border,
                color: "#fff", borderRadius: 999, padding: "10px 28px", fontSize: 14, fontWeight: 800,
                cursor: userStroke.length > 2 ? "pointer" : "default", fontFamily: "inherit",
              }}
            >
              خلصت ✓
            </button>
          </div>
        )}

        {state === "result" && (
          <div className="tr-screen" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginTop: 30 }}>
            <div style={{ fontSize: 44 }}>{accuracy >= SUCCESS_THRESHOLD ? "🌟" : "💪"}</div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: T.text, margin: 0 }}>
              {accuracy >= SUCCESS_THRESHOLD ? "أحسنت! تتبّع رائع" : "قريب جداً، جرّب تاني"}
            </h2>
            <div style={{ background: T.surface, borderRadius: 16, padding: "14px 30px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 26, fontWeight: 900, color: T.secondary }}>{accuracy}%</span>
              <span style={{ fontSize: 12, color: T.textMuted }}>دقة التتبّع</span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={retryLevel}
                style={{ padding: "12px 24px", borderRadius: 999, border: `2px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}
              >
                جرّب تاني
              </button>
              <button
                onClick={nextLevel}
                disabled={accuracy < SUCCESS_THRESHOLD}
                style={{
                  padding: "12px 24px", borderRadius: 999, border: "none",
                  background: accuracy >= SUCCESS_THRESHOLD ? T.secondary : T.border,
                  color: "#fff", fontSize: 14, fontWeight: 800,
                  cursor: accuracy >= SUCCESS_THRESHOLD ? "pointer" : "default", fontFamily: "inherit",
                }}
              >
                {level < LEVELS.length ? "المستوى التالي" : "خلّص اللعبة"}
              </button>
            </div>
          </div>
        )}

        {state === "finished" && (
          <div className="tr-screen" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginTop: 40 }}>
            <div style={{ fontSize: 48 }}>🏆</div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: T.text, margin: 0 }}>مبروك، خلّصت كل المستويات!</h1>
            <div style={{ background: T.surface, borderRadius: 16, padding: "16px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 30, fontWeight: 900, color: T.secondary }}>{totalScore}</span>
              <span style={{ fontSize: 12, color: T.textMuted }}>نقطة من {LEVELS.length * POINTS_PER_LEVEL}</span>
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
