import { useState } from "react";
import { kidsTokens as K } from "./theme";
import MemoryGame from "./MemoryGame";
import AnimalSoundsGame from "./AnimalSoundsGame";
import SequencingGame from "./SequencingGame";
import ColorMatchGame from "./ColorMatchGame";
import TracingGame from "./TracingGame";
import MusicGame from "./MusicGame";

const MOODS = [
  { id:"happy", emoji:"😄", label:"سعيد",  color:"#FFD93D", bg:"#FFFBEA", border:"#FFD93D" },
  { id:"calm",  emoji:"😌", label:"هادي",  color:"#6BCB77", bg:"#EDFFF0", border:"#6BCB77" },
  { id:"sad",   emoji:"😢", label:"زعلان", color:"#74B9FF", bg:"#EEF6FF", border:"#74B9FF" },
  { id:"angry", emoji:"😤", label:"غاضب",  color:"#FF6B6B", bg:"#FFF0F0", border:"#FF6B6B" },
];

const GAMES = [
  { id:"memory",  emoji:"🧠", label:"لعبة الذاكرة",  color:"#8E80BC", bg:"#F0EEF8", stars:3 },
  { id:"animals", emoji:"🐾", label:"أصوات الحيوانات", color:"#E9824C", bg:"#FEF0E8", stars:4 },
  { id:"puzzle",  emoji:"🧩", label:"البازل",        color:"#E9824C", bg:"#FEF0E8", stars:2 },
  { id:"colors",  emoji:"🎨", label:"خمّن اللون",     color:"#5BB88A", bg:"#EAF7F1", stars:3 },
  { id:"draw",    emoji:"✏️", label:"تتبّع الخطوط",   color:"#6BCB77", bg:"#EDFFF0", stars:5 },
  { id:"music",   emoji:"🎵", label:"الموسيقى",      color:"#74B9FF", bg:"#EEF6FF", stars:1 },
];

const DAYS_AR = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];

// Default tasks per day
const defaultTasks = () => [
  { id:"pray",    emoji:"🕌", label:"صلينا",          done:false },
  { id:"teeth",   emoji:"🦷", label:"غسلنا أسناننا",  done:false },
  { id:"game",    emoji:"🎮", label:"العبنا ألعاب",   done:false },
  { id:"hw",      emoji:"📚", label:"عملنا الواجب",   done:false },
  { id:"read",    emoji:"📖", label:"قرأنا كتاب",     done:false },
  { id:"eat",     emoji:"🥗", label:"أكلنا صحي",      done:false },
];

function buildWeek() {
  const today = new Date();
  const week = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - today.getDay() + i);
    const key = d.toDateString();
    week[key] = { date: d, tasks: defaultTasks() };
  }
  return week;
}

// ─── Stars ────────────────────────────────────────────────────────────────────
function Stars({ count }: { count: number }) {
  return (
    <div style={{ display:"flex", gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize:12, opacity: i <= count ? 1 : 0.25 }}>⭐</span>
      ))}
    </div>
  );
}

// ─── Section Title ────────────────────────────────────────────────────────────
function SectionTitle({ emoji, title }: { emoji: string; title: string }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
      <div style={{
        width:40, height:40, borderRadius:14, background:K.secondary+"18",
        display:"flex", alignItems:"center", justifyContent:"center", fontSize:20,
      }}>{emoji}</div>
      <h2 style={{ fontSize:20, fontWeight:900, color:K.text, margin:0 }}>{title}</h2>
    </div>
  );
}

// ─── Mood Section ─────────────────────────────────────────────────────────────
function MoodSection() {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (id: string) => {
    setSelected(id);
    setSubmitted(false);
  };

  const chosen = MOODS.find(m => m.id === selected);

  return (
    <div style={{ marginBottom:40 }}>
      <SectionTitle emoji="💭" title="كيف حالك النهارده؟" />
      <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
        {MOODS.map(m => (
          <button
            key={m.id}
            onClick={() => handleSelect(m.id)}
            style={{
              flex:"1 1 100px", minWidth:90,
              padding:"18px 10px",
              borderRadius:20,
              border: selected === m.id ? `3px solid ${m.border}` : `2px solid ${K.border}`,
              background: selected === m.id ? m.bg : K.surface,
              cursor:"pointer",
              display:"flex", flexDirection:"column", alignItems:"center", gap:8,
              boxShadow: selected === m.id
                ? `0 6px 24px ${m.color}33`
                : `0 2px 10px ${K.shadow}`,
              transform: selected === m.id ? "scale(1.07)" : "scale(1)",
              transition:"all 0.2s cubic-bezier(.4,1.6,.6,1)",
            }}
          >
            <span style={{ fontSize:42, lineHeight:1 }}>{m.emoji}</span>
            <span style={{ fontSize:13, fontWeight:800, color: selected === m.id ? m.color : K.textMuted }}>
              {m.label}
            </span>
          </button>
        ))}
      </div>

      {selected && !submitted && (
        <div style={{ marginTop:16, display:"flex", alignItems:"center", gap:12 }}>
          <div style={{
            flex:1, padding:"14px 18px", borderRadius:16,
            background: chosen!.bg, border:`1px solid ${chosen!.border}44`,
            fontSize:14, color:K.text, fontWeight:600,
          }}>
            {chosen!.emoji} {
              selected==="happy" ? "رائع! يوم حلو يستاهل ابتسامة 😊" :
              selected==="calm"  ? "تمام! الهدوء نعمة كبيرة 🌿" :
              selected==="sad"   ? "مش مشكلة، كلنا بيحصلنا كده 🤗" :
                                   "خد نفس عميق، هتبقى أحسن 💪"
            }
          </div>
          <button
            onClick={() => setSubmitted(true)}
            style={{
              padding:"12px 20px", borderRadius:14, border:"none",
              background:K.primary, color:"#fff",
              fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"inherit",
              boxShadow:`0 4px 14px ${K.primary}44`,
            }}
          >حفظ ✓</button>
        </div>
      )}

      {submitted && (
        <div style={{
          marginTop:16, padding:"14px 20px", borderRadius:16,
          background:K.secondary+"15", border:`1px solid ${K.secondary}33`,
          fontSize:14, color:K.secondary, fontWeight:700, textAlign:"center",
        }}>
          ✅ تم حفظ مزاجك النهارده!
        </div>
      )}
    </div>
  );
}

// ─── Calendar / Todo Section ──────────────────────────────────────────────────
function CalendarSection() {
  const [week, setWeek] = useState(buildWeek);
  const todayKey = new Date().toDateString();
  const [selectedDay, setSelectedDay] = useState(todayKey);

  const toggleTask = (taskId: string) => {
    setWeek(prev => {
      const updated = { ...prev };
      const dayData = { ...updated[selectedDay] };
      dayData.tasks = dayData.tasks.map(t =>
        t.id === taskId ? { ...t, done: !t.done } : t
      );
      updated[selectedDay] = dayData;
      return updated;
    });
  };

  const dayData = week[selectedDay];
  const donePct = Math.round((dayData.tasks.filter(t => t.done).length / dayData.tasks.length) * 100);

  return (
    <div style={{ marginBottom:40 }}>
      <SectionTitle emoji="📅" title="مهام اليوم" />

      {/* Day selector */}
      <div style={{ display:"flex", gap:8, marginBottom:20, overflowX:"auto", paddingBottom:4 }}>
        {Object.entries(week).map(([key, { date }]) => {
          const isToday  = key === todayKey;
          const isActive = key === selectedDay;
          const done     = week[key].tasks.filter(t => t.done).length;
          const total    = week[key].tasks.length;
          return (
            <button key={key} onClick={() => setSelectedDay(key)} style={{
              flexShrink:0, padding:"10px 14px", borderRadius:16, border:"none",
              background: isActive ? K.primary : K.surface,
              color: isActive ? "#fff" : K.textMuted,
              fontFamily:"inherit", cursor:"pointer",
              boxShadow: isActive ? `0 4px 16px ${K.primary}44` : `0 2px 8px ${K.shadow}`,
              transform: isActive ? "scale(1.05)" : "scale(1)",
              transition:"all 0.2s",
              minWidth:72, textAlign:"center",
            }}>
              <div style={{ fontSize:11, fontWeight:600, marginBottom:4, opacity:isActive?1:0.7 }}>
                {isToday ? "اليوم" : DAYS_AR[date.getDay()].slice(0,3)}
              </div>
              <div style={{ fontSize:18, fontWeight:900 }}>{date.getDate()}</div>
              <div style={{ fontSize:10, marginTop:4, opacity:0.8 }}>{done}/{total}</div>
            </button>
          );
        })}
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom:18 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
          <span style={{ fontSize:13, color:K.textMuted, fontWeight:600 }}>التقدم</span>
          <span style={{ fontSize:13, color:K.primary, fontWeight:800 }}>{donePct}%</span>
        </div>
        <div style={{ height:10, background:K.border, borderRadius:999, overflow:"hidden" }}>
          <div style={{
            height:"100%", width:`${donePct}%`,
            background:`linear-gradient(90deg, ${K.primary}, #F5A47C)`,
            borderRadius:999, transition:"width 0.4s ease",
          }}/>
        </div>
        {donePct === 100 && (
          <div style={{ textAlign:"center", marginTop:10, fontSize:22 }}>
            🎉 أنجزت كل مهامك! عظيم جداً!
          </div>
        )}
      </div>

      {/* Task list */}
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {dayData.tasks.map(task => (
          <button
            key={task.id}
            onClick={() => toggleTask(task.id)}
            style={{
              display:"flex", alignItems:"center", gap:14,
              padding:"14px 18px", borderRadius:18, border:"none",
              background: task.done
                ? `linear-gradient(135deg, ${K.primary}18, ${K.secondary}10)`
                : K.surface,
              boxShadow: `0 2px 10px ${K.shadow}`,
              cursor:"pointer", fontFamily:"inherit", textAlign:"right",
              transition:"all 0.2s",
              border: task.done ? `1.5px solid ${K.primary}44` : `1.5px solid ${K.border}`,
            }}
          >
            {/* Checkbox */}
            <div style={{
              width:28, height:28, borderRadius:10, flexShrink:0,
              background: task.done ? K.primary : "transparent",
              border: task.done ? "none" : `2px solid ${K.border}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:16, transition:"all 0.2s",
              boxShadow: task.done ? `0 3px 10px ${K.primary}55` : "none",
            }}>
              {task.done && "✓"}
            </div>

            <span style={{ fontSize:24 }}>{task.emoji}</span>

            <span style={{
              fontSize:15, fontWeight:700, flex:1,
              color: task.done ? K.primary : K.text,
              textDecoration: task.done ? "line-through" : "none",
              opacity: task.done ? 0.7 : 1,
            }}>
              {task.label}
            </span>

            {task.done && <span style={{ fontSize:20 }}>⭐</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Games Section ────────────────────────────────────────────────────────────
function GamesSection({ onPlayGame }: { onPlayGame: (id: string) => void }) {
  return (
    <div style={{ marginBottom:40 }}>
      <SectionTitle emoji="🎮" title="ألعابي" />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:14 }}>
        {GAMES.map(g => (
          <button
            key={g.id}
            onClick={() => onPlayGame(g.id)}
            style={{
              padding:"22px 14px", borderRadius:22, border:`2px solid ${g.color}33`,
              background: g.bg, cursor:"pointer", fontFamily:"inherit",
              display:"flex", flexDirection:"column", alignItems:"center", gap:10,
              boxShadow:`0 4px 16px ${g.color}22`,
              transition:"transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-4px) scale(1.03)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 10px 28px ${g.color}44`;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = "";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 16px ${g.color}22`;
            }}
          >
            <span style={{ fontSize:44, lineHeight:1 }}>{g.emoji}</span>
            <span style={{ fontSize:13, fontWeight:800, color:g.color }}>{g.label}</span>
            <Stars count={g.stars} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
function Header({ points }: { points: number }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "صباح الخير" : hour < 17 ? "مرحباً" : "مساء الخير";
  return (
    <div style={{
      padding:"24px 24px 20px",
      background:`linear-gradient(135deg, ${K.primary} 0%, ${K.secondary} 100%)`,
      borderRadius:"0 0 32px 32px",
      marginBottom:32,
      position:"relative", overflow:"hidden",
    }}>
      {/* Decorative circles */}
      {[{s:120,t:-30,r:-30,o:0.12},{s:80,t:10,r:60,o:0.08},{s:60,t:-10,l:40,o:0.1}].map((c,i)=>(
        <div key={i} style={{
          position:"absolute", width:c.s, height:c.s, borderRadius:"50%",
          background:"#fff", opacity:c.o,
          top:c.t, right:c.r, left:c.l,
          pointerEvents:"none",
        }}/>
      ))}

      <div style={{ position:"relative" }}>
        <div style={{ fontSize:13, color:"rgba(255,255,255,0.75)", marginBottom:4, fontWeight:600 }}>
          {greeting} 👋
        </div>
        <h1 style={{ fontSize:26, fontWeight:900, color:"#fff", margin:"0 0 16px" }}>
          أهلاً يا بطل! 🦸
        </h1>

        {/* Quick stats */}
        <div style={{ display:"flex", gap:10 }}>
          {[
            { icon:"🎮", label:"ألعاب", value:"4" },
            { icon:"⭐", label:"نقاطي", value:String(points) },
            { icon:"🏆", label:"إنجازات", value:"7" },
          ].map(({icon,label,value}) => (
            <div key={label} style={{
              flex:1, padding:"10px 8px", borderRadius:14,
              background:"rgba(255,255,255,0.18)",
              backdropFilter:"blur(8px)",
              textAlign:"center",
            }}>
              <div style={{ fontSize:20 }}>{icon}</div>
              <div style={{ fontSize:16, fontWeight:900, color:"#fff" }}>{value}</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.75)", marginTop:1 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────
const TABS = [
  { id:"home",     icon:"🏠", label:"الرئيسية" },
  { id:"games",    icon:"🎮", label:"ألعاب" },
  { id:"calendar", icon:"📅", label:"مهامي" },
  { id:"mood",     icon:"😊", label:"مزاجي" },
];

function BottomNav({ active, onNav }: { active: string; onNav: (id:string)=>void }) {
  return (
    <nav style={{
      position:"fixed", bottom:0, right:0, left:0,
      background:K.surface, borderTop:`1px solid ${K.border}`,
      display:"flex", padding:"8px 0 12px",
      boxShadow:"0 -4px 20px rgba(142,128,188,0.1)",
      zIndex:50,
    }}>
      {TABS.map(t => {
        const isActive = active === t.id;
        return (
          <button key={t.id} onClick={() => onNav(t.id)} style={{
            flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3,
            border:"none", background:"none", cursor:"pointer", fontFamily:"inherit",
            padding:"6px 4px",
          }}>
            <div style={{
              width:44, height:44, borderRadius:14,
              background: isActive ? K.primary+"18" : "transparent",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:22, transition:"all 0.2s",
              transform: isActive ? "scale(1.1)" : "scale(1)",
            }}>{t.icon}</div>
            <span style={{
              fontSize:10, fontWeight: isActive ? 800 : 500,
              color: isActive ? K.primary : K.textMuted,
            }}>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ─── Game Modal ───────────────────────────────────────────────────────────────
function GameModal({ gameId, onClose }: { gameId: string; onClose: () => void }) {
  const game = GAMES.find(g => g.id === gameId);
  if (!game) return null;
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:100,
      background:"rgba(44,34,64,0.5)", backdropFilter:"blur(6px)",
      display:"flex", alignItems:"center", justifyContent:"center", padding:20,
    }}>
      <div style={{
        background:K.surface, borderRadius:28, padding:"36px 32px",
        textAlign:"center", maxWidth:320, width:"100%",
        boxShadow:"0 24px 60px rgba(142,128,188,0.25)",
      }}>
        <div style={{ fontSize:64, marginBottom:12 }}>{game.emoji}</div>
        <h2 style={{ fontSize:22, fontWeight:900, color:K.text, margin:"0 0 8px" }}>{game.label}</h2>
        <Stars count={game.stars} />
        <p style={{ fontSize:13, color:K.textMuted, margin:"14px 0 24px", lineHeight:1.6 }}>
          قريباً هتلعب اللعبة دي هنا! 🎉
        </p>
        <button onClick={onClose} style={{
          width:"100%", padding:"13px", borderRadius:14, border:"none",
          background:K.primary, color:"#fff", fontSize:15, fontWeight:800,
          cursor:"pointer", fontFamily:"inherit",
          boxShadow:`0 6px 18px ${K.primary}44`,
        }}>تمام 👍</button>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function KidsDashboard() {
  const [tab, setTab]           = useState("home");
  const [gameModal, setGame]    = useState<string|null>(null);
  const [activeGame, setActive] = useState<string|null>(null);
  const [points, setPoints]     = useState(120);

  const handlePlayGame = (id: string) => {
    // All six games are now live.
    setActive(id);
  };

  const handleMemoryComplete = ({ moves }: { moves: number; time: number }) => {
    const reward = moves <= 8 ? 20 : 10; // fewer moves earns more coins
    setPoints(p => p + reward);
    // TODO(Supabase): persist the reward to the child's rewards row.
    // await supabase.from("rewards").update({ coins: coins + reward }).eq("child_id", childId);
  };

  const handleAnimalSoundsComplete = ({ score }: { score: number; level: number }) => {
    const reward = Math.round(score / 5); // 100 points max -> up to 20 coins
    setPoints(p => p + reward);
    // TODO(Supabase): persist the reward to the child's rewards row.
    // await supabase.from("rewards").update({ coins: coins + reward }).eq("child_id", childId);
  };

  const handleSequencingComplete = ({ score }: { score: number; level: number }) => {
    const reward = Math.round(score / 3); // 105 points max -> up to 35 coins
    setPoints(p => p + reward);
    // TODO(Supabase): persist the reward to the child's rewards row.
    // await supabase.from("rewards").update({ coins: coins + reward }).eq("child_id", childId);
  };

  const handleColorMatchComplete = ({ score }: { score: number; level: number }) => {
    const reward = Math.round(score / 5); // 100 points max -> up to 20 coins
    setPoints(p => p + reward);
    // TODO(Supabase): persist the reward to the child's rewards row.
    // await supabase.from("rewards").update({ coins: coins + reward }).eq("child_id", childId);
  };

  const handleTracingComplete = ({ score }: { score: number; level: number }) => {
    const reward = Math.round(score / 2); // 60 points max -> up to 30 coins
    setPoints(p => p + reward);
    // TODO(Supabase): persist the reward to the child's rewards row.
    // await supabase.from("rewards").update({ coins: coins + reward }).eq("child_id", childId);
  };

  const handleMusicComplete = ({ score }: { score: number; level: number }) => {
    const reward = Math.round(score / 2); // 60 points max -> up to 30 coins
    setPoints(p => p + reward);
    // TODO(Supabase): persist the reward to the child's rewards row.
    // await supabase.from("rewards").update({ coins: coins + reward }).eq("child_id", childId);
  };

  if (activeGame === "memory") {
    return <MemoryGame onExit={() => setActive(null)} onComplete={handleMemoryComplete} />;
  }
  if (activeGame === "animals") {
    return <AnimalSoundsGame onExit={() => setActive(null)} onComplete={handleAnimalSoundsComplete} />;
  }
  if (activeGame === "puzzle") {
    return <SequencingGame onExit={() => setActive(null)} onComplete={handleSequencingComplete} />;
  }
  if (activeGame === "colors") {
    return <ColorMatchGame onExit={() => setActive(null)} onComplete={handleColorMatchComplete} />;
  }
  if (activeGame === "draw") {
    return <TracingGame onExit={() => setActive(null)} onComplete={handleTracingComplete} />;
  }
  if (activeGame === "music") {
    return <MusicGame onExit={() => setActive(null)} onComplete={handleMusicComplete} />;
  }

  const renderContent = () => {
    if (tab === "games")    return <GamesSection onPlayGame={handlePlayGame} />;
    if (tab === "calendar") return <CalendarSection />;
    if (tab === "mood")     return <MoodSection />;
    // home = all sections
    return (
      <>
        <MoodSection />
        <CalendarSection />
        <GamesSection onPlayGame={handlePlayGame} />
      </>
    );
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        button:active { transform: scale(0.96) !important; }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation: none !important; transition: none !important; }
        }
      `}</style>

      <div style={{
        minHeight:"100vh", background:K.bg,
        fontFamily:"'Tajawal',sans-serif", direction:"rtl",
        paddingBottom:90,
      }}>
        <Header points={points} />

        <div style={{ padding:"0 16px", maxWidth:600, margin:"0 auto" }}>
          {renderContent()}
        </div>

        <BottomNav active={tab} onNav={setTab} />

        {gameModal && <GameModal gameId={gameModal} onClose={() => setGame(null)} />}
      </div>
    </>
  );
}
