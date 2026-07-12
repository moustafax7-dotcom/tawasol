import { useState } from "react";
import { specialistTokens as T } from "./theme";
import { useTawaslDashboardData } from "../hooks/useTawaslDashboardData";
import { supabase } from "../supabaseClient";

function progressColor(p) {
  return p >= 70 ? T.success : p >= 45 ? T.warning : T.danger;
}

const statusColors = {
  "متاح":          { bg:T.successBg,   color:T.success },
  "في جلسة":       { bg:T.secondaryBg, color:T.secondary },
  "غير متاح":      { bg:"#F0F0F0",     color:T.textMuted },
  "منتهية":        { bg:"#F0F0F0",     color:T.textMuted },
  "جارية":         { bg:T.primaryBg,   color:T.primary },
  "قادمة":         { bg:T.secondaryBg, color:T.secondary },
  "ملغاة":         { bg:"#F0F0F0",     color:T.textMuted },
  "يحتاج متابعة": { bg:T.dangerBg,    color:T.danger },
  "مستقر":         { bg:T.successBg,   color:T.success },
  "ممتاز":         { bg:"#E8F4FD",     color:"#4A90C4" },
  "جديد":          { bg:T.secondaryBg, color:T.secondary },
};

function todayLabel() {
  return new Date().toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

// ─── UI Components ──────────────────────────────────────────────────────────
function StatusPill({ label }) {
  const { bg, color } = statusColors[label] ?? { bg:"#F0F0F0", color:T.textMuted };
  return <span style={{ background:bg, color, fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:999, whiteSpace:"nowrap" }}>{label}</span>;
}

function ProgressBar({ pct, showLabel=true }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      {showLabel && <span style={{ fontSize:13, fontWeight:700, color:T.text, minWidth:34 }}>{pct}%</span>}
      <div style={{ flex:1, height:8, background:T.border, borderRadius:999, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:progressColor(pct), borderRadius:999, transition:"width 0.6s" }}/>
      </div>
    </div>
  );
}

function Card({ children, style={}, onClick=undefined }) {
  return (
    <div onClick={onClick} style={{
      background:T.surface, borderRadius:16, border:`1px solid ${T.border}`,
      boxShadow:`0 2px 10px ${T.shadow}`, overflow:"hidden",
      cursor:onClick?"pointer":"default", transition:"transform 0.15s",
      ...style,
    }}>{children}</div>
  );
}

function Avatar({ name, size=40 }) {
  const initials = name.replace("د. ","").slice(0,2);
  const colors   = ["#E9824C","#6B8FA8","#5BB88A","#8E80BC","#E9C84C"];
  const color    = colors[name.charCodeAt(0) % colors.length];
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:color+"22", border:`2px solid ${color}44`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size*0.35, fontWeight:800, color, flexShrink:0 }}>{initials}</div>
  );
}

function StatCard({ icon, value, label, sub, accent=T.primary }) {
  return (
    <Card style={{ padding:"18px 20px", flex:1, minWidth:130 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <div style={{ fontSize:26, fontWeight:900, color:T.text, lineHeight:1 }}>{value}</div>
          <div style={{ fontSize:12, color:T.textMuted, marginTop:4 }}>{label}</div>
          {sub && <div style={{ fontSize:11, color:T.textLight, marginTop:2 }}>{sub}</div>}
        </div>
        <div style={{ width:40, height:40, borderRadius:12, background:accent+"18",
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{icon}</div>
      </div>
    </Card>
  );
}

function Btn({ children, onClick=undefined, variant="primary", size="md", style:ex={}, type="button", disabled=false }) {
  const v = { primary:{background:T.primary,color:"#fff"}, secondary:{background:T.secondaryBg,color:T.secondary,border:`1px solid ${T.border}`}, ghost:{background:"transparent",color:T.textMuted,border:`1px solid ${T.border}`} };
  return (
    <button type={type} disabled={disabled} onClick={onClick} style={{ border:"none", borderRadius:size==="sm"?8:10, padding:size==="sm"?"5px 12px":"9px 18px",
      fontSize:size==="sm"?12:13, fontWeight:700, cursor:disabled?"default":"pointer", opacity:disabled?0.6:1, fontFamily:"inherit", ...v[variant], ...ex }}>
      {children}
    </button>
  );
}

// ─── NAV ────────────────────────────────────────────────────────────────────
const NAV = [
  { id:"overview", label:"نظرة عامة", icon:"⊞" },
  { id:"cases", label:"الحالات", icon:"📋" },
  { id:"sessions", label:"الجلسات", icon:"📅" },
  { id:"reports", label:"التقارير", icon:"📊" },
];

// ─── Pages ──────────────────────────────────────────────────────────────────
function OverviewPage({ onNavigate, cases, sessionsToday }) {
  const urgent = cases.filter(c => c.status === "يحتاج متابعة");
  const avgProgress = cases.length > 0 ? Math.round(cases.reduce((a,c)=>a+c.progressPercent,0)/cases.length) : 0;
  const SBG = { "منتهية":T.border, "جارية":T.primaryBg, "قادمة":T.secondaryBg, "ملغاة":T.border };
  const SC  = { "منتهية":T.textMuted, "جارية":T.primary, "قادمة":T.secondary, "ملغاة":T.textMuted };
  return (
    <div style={{ padding:"28px 28px 40px" }}>
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:13, color:T.textMuted, marginBottom:4 }}>{todayLabel()}</div>
        <h1 style={{ fontSize:26, fontWeight:900, color:T.text, margin:0 }}>نظرة عامة</h1>
      </div>
      <div style={{ display:"flex", gap:14, marginBottom:28, flexWrap:"wrap" }}>
        <StatCard icon="📋" value={cases.length}        label="الحالات النشطة"   accent={T.primary} />
        <StatCard icon="📈" value={`${avgProgress}%`}   label="متوسط التقدم"     accent={T.success} />
        <StatCard icon="📅" value={sessionsToday.length} label="جلسات اليوم"      accent={T.secondary} />
        <StatCard icon="⚠️" value={urgent.length}        label="تحتاج متابعة"     accent={T.danger} />
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
        <Card style={{ padding:"20px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <h2 style={{ fontSize:16, fontWeight:800, color:T.text, margin:0 }}>حالاتي</h2>
            <Btn variant="secondary" size="sm" onClick={() => onNavigate("cases")}>عرض الكل</Btn>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {cases.length === 0 && <div style={{ fontSize:13, color:T.textMuted, textAlign:"center", padding:20 }}>لسه مفيش حالات مربوطة بيك</div>}
            {cases.slice(0, 5).map(c => (
              <div key={c.id} style={{ display:"flex", alignItems:"center", gap:12, paddingBottom:12, borderBottom:`1px solid ${T.border}` }}>
                <Avatar name={c.childName} size={36} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{c.childName}</div>
                  <div style={{ fontSize:11, color:T.textMuted }}>تقدم {c.progressPercent}%</div>
                </div>
                <StatusPill label={c.status} />
              </div>
            ))}
          </div>
        </Card>
        <Card style={{ padding:"20px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <h2 style={{ fontSize:16, fontWeight:800, color:T.text, margin:0 }}>جلسات اليوم</h2>
            <Btn variant="secondary" size="sm" onClick={() => onNavigate("sessions")}>عرض الكل</Btn>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {sessionsToday.length === 0 && <div style={{ fontSize:13, color:T.textMuted, textAlign:"center", padding:20 }}>مفيش جلسات مجدولة النهاردة</div>}
            {sessionsToday.map(s => (
              <div key={s.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:12, background:SBG[s.status]??T.surfaceAlt }}>
                <div style={{ fontSize:13, fontWeight:700, minWidth:56, color:SC[s.status]??T.text }}>{s.time}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{s.childName}</div>
                  <div style={{ fontSize:11, color:T.textMuted }}>{s.type}</div>
                </div>
                <span style={{ fontSize:11, fontWeight:700, color:SC[s.status]??T.textMuted }}>{s.status}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      {urgent.length > 0 && (
        <Card style={{ padding:"20px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <h2 style={{ fontSize:16, fontWeight:800, color:T.text, margin:0 }}>حالات تحتاج متابعة عاجلة</h2>
            <Btn variant="secondary" size="sm" onClick={() => onNavigate("cases")}>عرض الكل</Btn>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            {urgent.map(c => (
              <div key={c.id} style={{ padding:"16px", borderRadius:12, background:T.dangerBg, border:`1px solid ${T.danger}22` }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:800, color:T.text }}>{c.childName}</div>
                    <div style={{ fontSize:11, color:T.textMuted }}>{c.ageYears} سنوات</div>
                  </div>
                  <StatusPill label={c.status} />
                </div>
                <ProgressBar pct={c.progressPercent} />
                <div style={{ fontSize:11, color:T.textMuted, marginTop:8 }}>آخر جلسة: {c.lastSession}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function CasesPage({ cases }) {
  const [filter, setFilter] = useState("الكل");
  const [view, setView]     = useState("cards");
  const FILTERS = ["الكل","يحتاج متابعة","مستقر","ممتاز"];
  const filtered = filter === "الكل" ? cases : cases.filter(c => c.status === filter);
  return (
    <div style={{ padding:"28px 28px 40px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:24 }}>
        <div>
          <div style={{ fontSize:13, color:T.textMuted, marginBottom:4 }}>{todayLabel()}</div>
          <h1 style={{ fontSize:26, fontWeight:900, color:T.text, margin:0 }}>الحالات</h1>
        </div>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding:"6px 14px", borderRadius:999, fontFamily:"inherit",
              border:filter===f?`2px solid ${T.primary}`:`2px solid ${T.border}`,
              background:filter===f?T.primaryBg:T.surface, color:filter===f?T.primary:T.textMuted,
              fontSize:12, fontWeight:700, cursor:"pointer" }}>{f}</button>
          ))}
        </div>
        <div style={{ display:"flex", gap:6 }}>
          {["cards","table"].map(v => (
            <button key={v} onClick={()=>setView(v)} style={{ padding:"6px 12px", borderRadius:8, fontFamily:"inherit",
              border:`1px solid ${T.border}`, background:view===v?T.primary:T.surface,
              color:view===v?"#fff":T.textMuted, fontSize:12, fontWeight:700, cursor:"pointer" }}>
              {v==="cards"?"⊞ بطاقات":"☰ جدول"}
            </button>
          ))}
        </div>
      </div>
      {filtered.length === 0 && (
        <div style={{ textAlign:"center", padding:40, color:T.textMuted, fontSize:14 }}>مفيش حالات في القسم ده</div>
      )}
      {view === "cards" ? (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:18 }}>
          {filtered.map(c => (
            <Card key={c.id} style={{ padding:"20px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                  <Avatar name={c.childName} size={40} />
                  <div>
                    <div style={{ fontSize:14, fontWeight:800, color:T.text }}>{c.childName}</div>
                    <div style={{ fontSize:11, color:T.textMuted }}>{c.ageYears} سنوات · مزاج {c.mood}</div>
                  </div>
                </div>
                <StatusPill label={c.status} />
              </div>
              <ProgressBar pct={c.progressPercent} />
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:12 }}>
                <span style={{ fontSize:11, color:T.textMuted }}>آخر جلسة: {c.lastSession}</span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ borderBottom:`2px solid ${T.border}` }}>
                {["الطفل","العمر","المزاج","التقدم","آخر جلسة","الحالة"].map(h=>(
                  <th key={h} style={{ padding:"12px 14px", textAlign:"right", color:T.textMuted, fontWeight:700, fontSize:12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c,i) => (
                <tr key={c.id} style={{ background:i%2===0?T.surface:T.surfaceAlt }}>
                  <td style={{ padding:"12px 14px" }}><div style={{ display:"flex", gap:8, alignItems:"center" }}><Avatar name={c.childName} size={28}/><span style={{ fontWeight:700 }}>{c.childName}</span></div></td>
                  <td style={{ padding:"12px 14px", color:T.textMuted }}>{c.ageYears} سنوات</td>
                  <td style={{ padding:"12px 14px" }}>{c.mood}</td>
                  <td style={{ padding:"12px 14px", minWidth:120 }}><ProgressBar pct={c.progressPercent}/></td>
                  <td style={{ padding:"12px 14px", color:T.textMuted }}>{c.lastSession}</td>
                  <td style={{ padding:"12px 14px" }}><StatusPill label={c.status}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function BookSessionModal({ cases, onClose, onCreate }) {
  const [childId, setChildId] = useState(cases[0]?.id || "");
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(45);
  const [type, setType] = useState("ABA");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!childId || !time) { setErr("محتاجين الطفل والوقت"); return; }
    setSaving(true);
    const { error } = await onCreate({ childId, date, time, duration: Number(duration), type });
    setSaving(false);
    if (error) setErr(error); else onClose();
  }

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(20,20,25,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <form onClick={(e)=>e.stopPropagation()} onSubmit={handleSubmit} style={{ background:T.surface, borderRadius:20, padding:24, width:"100%", maxWidth:380, display:"flex", flexDirection:"column", gap:12 }}>
        <h3 style={{ margin:0, fontSize:17, fontWeight:800, color:T.text }}>حجز جلسة جديدة</h3>
        <select value={childId} onChange={(e)=>setChildId(e.target.value)} style={{ padding:"10px 12px", borderRadius:10, border:`1.5px solid ${T.border}`, fontFamily:"inherit" }}>
          {cases.map(c => <option key={c.id} value={c.id}>{c.childName}</option>)}
        </select>
        <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} style={{ padding:"10px 12px", borderRadius:10, border:`1.5px solid ${T.border}`, fontFamily:"inherit" }} />
        <input type="text" placeholder="الوقت (مثال: 10:00 ص)" value={time} onChange={(e)=>setTime(e.target.value)} style={{ padding:"10px 12px", borderRadius:10, border:`1.5px solid ${T.border}`, fontFamily:"inherit" }} />
        <input type="number" placeholder="المدة (دقيقة)" value={duration} onChange={(e)=>setDuration(e.target.value)} style={{ padding:"10px 12px", borderRadius:10, border:`1.5px solid ${T.border}`, fontFamily:"inherit" }} />
        <select value={type} onChange={(e)=>setType(e.target.value)} style={{ padding:"10px 12px", borderRadius:10, border:`1.5px solid ${T.border}`, fontFamily:"inherit" }}>
          {["ABA","PECS","Speech","متابعة العلاج"].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {err && <div style={{ color:T.danger, fontSize:12 }}>{err}</div>}
        <div style={{ display:"flex", gap:10 }}>
          <Btn type="button" variant="secondary" style={{ flex:1 }} onClick={onClose}>إلغاء</Btn>
          <Btn type="submit" style={{ flex:1 }} disabled={saving}>{saving ? "جاري الحجز..." : "احجز"}</Btn>
        </div>
      </form>
    </div>
  );
}

function SessionsPage({ sessionsToday, cases, createSession, updateSessionStatus }) {
  const [filter, setFilter] = useState("الكل");
  const [showModal, setShowModal] = useState(false);
  const FILTERS = ["الكل","جارية","قادمة","منتهية"];
  const DOT = { "منتهية":T.textLight, "جارية":T.primary, "قادمة":T.secondary, "ملغاة":T.textLight };
  const filtered = filter === "الكل" ? sessionsToday : sessionsToday.filter(s => s.status === filter);
  return (
    <div style={{ padding:"28px 28px 40px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:24 }}>
        <div>
          <div style={{ fontSize:13, color:T.textMuted, marginBottom:4 }}>{todayLabel()}</div>
          <h1 style={{ fontSize:26, fontWeight:900, color:T.text, margin:0 }}>الجلسات</h1>
        </div>
        <Btn onClick={()=>setShowModal(true)} disabled={cases.length===0}>+ حجز جلسة</Btn>
      </div>
      <div style={{ display:"flex", gap:14, marginBottom:28, flexWrap:"wrap" }}>
        <StatCard icon="📅" value={sessionsToday.length}                                      label="إجمالي اليوم" accent={T.secondary} />
        <StatCard icon="🔄" value={sessionsToday.filter(s=>s.status==="جارية").length}   label="جارية الآن"   accent={T.primary} />
        <StatCard icon="⏳" value={sessionsToday.filter(s=>s.status==="قادمة").length}   label="قادمة"        accent={T.warning} />
        <StatCard icon="✅" value={sessionsToday.filter(s=>s.status==="منتهية").length}  label="منتهية"       accent={T.success} />
      </div>
      <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
        {FILTERS.map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{ padding:"6px 16px", borderRadius:999, fontFamily:"inherit",
            border:filter===f?`2px solid ${T.primary}`:`2px solid ${T.border}`,
            background:filter===f?T.primaryBg:T.surface, color:filter===f?T.primary:T.textMuted,
            fontSize:12, fontWeight:700, cursor:"pointer" }}>{f}</button>
        ))}
      </div>
      <Card style={{ padding:"8px 0" }}>
        {filtered.length === 0 && <div style={{ textAlign:"center", padding:30, color:T.textMuted, fontSize:14 }}>مفيش جلسات في القسم ده</div>}
        {filtered.map((s,i) => (
          <div key={s.id} style={{ display:"flex", alignItems:"center", gap:16, padding:"16px 20px",
            borderBottom:i<filtered.length-1?`1px solid ${T.border}`:undefined,
            background:s.status==="جارية"?T.primaryBg+"88":"transparent" }}>
            <div style={{ width:10, height:10, borderRadius:"50%", background:DOT[s.status]??T.textMuted, flexShrink:0 }}/>
            <div style={{ fontSize:15, fontWeight:800, color:T.text, minWidth:68 }}>{s.time}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:700, color:T.text }}>{s.childName}</div>
              <div style={{ fontSize:12, color:T.textMuted }}>{s.type}</div>
            </div>
            <div style={{ fontSize:12, color:T.textMuted, background:T.surfaceAlt, padding:"4px 10px", borderRadius:8 }}>{s.durationMin} دقيقة</div>
            <StatusPill label={s.status} />
            <div style={{ display:"flex", gap:8 }}>
              {s.status==="قادمة" && <Btn variant="ghost" size="sm" onClick={()=>updateSessionStatus(s.id,"cancelled")}>إلغاء</Btn>}
              {s.status==="قادمة" && <Btn variant="primary" size="sm" onClick={()=>updateSessionStatus(s.id,"in_progress")}>بدء</Btn>}
              {s.status==="جارية" && <Btn variant="primary" size="sm" onClick={()=>updateSessionStatus(s.id,"completed")}>إنهاء</Btn>}
            </div>
          </div>
        ))}
      </Card>
      {showModal && (
        <BookSessionModal cases={cases} onClose={()=>setShowModal(false)} onCreate={createSession} />
      )}
    </div>
  );
}

function NewReportModal({ cases, onClose, onCreate }) {
  const [childId, setChildId] = useState(cases[0]?.id || "");
  const [content, setContent] = useState("");
  const [progress, setProgress] = useState("");
  const [recs, setRecs] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!childId || !content.trim()) { setErr("محتاجين الطفل والملخص على الأقل"); return; }
    setSaving(true);
    const { error } = await onCreate({ childId, content: content.trim(), progress, recommendations: recs });
    setSaving(false);
    if (error) setErr(error); else onClose();
  }

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(20,20,25,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <form onClick={(e)=>e.stopPropagation()} onSubmit={handleSubmit} style={{ background:T.surface, borderRadius:20, padding:24, width:"100%", maxWidth:420, display:"flex", flexDirection:"column", gap:12 }}>
        <h3 style={{ margin:0, fontSize:17, fontWeight:800, color:T.text }}>تقرير جديد</h3>
        <select value={childId} onChange={(e)=>setChildId(e.target.value)} style={{ padding:"10px 12px", borderRadius:10, border:`1.5px solid ${T.border}`, fontFamily:"inherit" }}>
          {cases.map(c => <option key={c.id} value={c.id}>{c.childName}</option>)}
        </select>
        <textarea placeholder="الملخص" value={content} onChange={(e)=>setContent(e.target.value)} rows={4}
          style={{ padding:"10px 12px", borderRadius:10, border:`1.5px solid ${T.border}`, fontFamily:"inherit", resize:"vertical" }} />
        <input type="number" placeholder="نسبة التقدم %" value={progress} onChange={(e)=>setProgress(e.target.value)}
          style={{ padding:"10px 12px", borderRadius:10, border:`1.5px solid ${T.border}`, fontFamily:"inherit" }} />
        <textarea placeholder="التوصيات (افصل بينهم بفاصلة ,)" value={recs} onChange={(e)=>setRecs(e.target.value)} rows={3}
          style={{ padding:"10px 12px", borderRadius:10, border:`1.5px solid ${T.border}`, fontFamily:"inherit", resize:"vertical" }} />
        {err && <div style={{ color:T.danger, fontSize:12 }}>{err}</div>}
        <div style={{ display:"flex", gap:10 }}>
          <Btn type="button" variant="secondary" style={{ flex:1 }} onClick={onClose}>إلغاء</Btn>
          <Btn type="submit" style={{ flex:1 }} disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ التقرير"}</Btn>
        </div>
      </form>
    </div>
  );
}

function ReportsPage({ reports, cases, createReport }) {
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const avgProgress = cases.length > 0 ? Math.round(cases.reduce((a,c)=>a+c.progressPercent,0)/cases.length) : 0;
  return (
    <div style={{ padding:"28px 28px 40px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:24 }}>
        <div>
          <div style={{ fontSize:13, color:T.textMuted, marginBottom:4 }}>{todayLabel()}</div>
          <h1 style={{ fontSize:26, fontWeight:900, color:T.text, margin:0 }}>التقارير</h1>
        </div>
        <Btn onClick={()=>setShowModal(true)} disabled={cases.length===0}>+ تقرير جديد</Btn>
      </div>
      <div style={{ display:"flex", gap:14, marginBottom:28, flexWrap:"wrap" }}>
        <StatCard icon="📊" value={reports.length} label="إجمالي التقارير" accent={T.primary} />
        <StatCard icon="📈" value={`${avgProgress}%`} label="متوسط التقدم" accent={T.success} />
        <StatCard icon="⚠️" value={cases.filter(c=>c.status==="يحتاج متابعة").length} label="تحتاج متابعة" accent={T.danger} />
      </div>
      {reports.length === 0 && (
        <div style={{ textAlign:"center", padding:40, color:T.textMuted, fontSize:14 }}>لسه مفيش تقارير مكتوبة</div>
      )}
      <div style={{ display:"grid", gridTemplateColumns:selected?"1fr 360px":"1fr", gap:20 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {reports.map(r => (
            <Card key={r.id} onClick={()=>setSelected(r.id===selected?.id?null:r)}
              style={{ padding:"20px", border:selected?.id===r.id?`2px solid ${T.primary}`:`1px solid ${T.border}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                  <Avatar name={r.childName} size={42} />
                  <div>
                    <div style={{ fontSize:15, fontWeight:800, color:T.text }}>{r.childName}</div>
                    <div style={{ fontSize:12, color:T.textMuted }}>{r.date}</div>
                  </div>
                </div>
                <div style={{ fontSize:20, fontWeight:900, color:progressColor(r.progressPercent) }}>{r.progressPercent}%</div>
              </div>
              <ProgressBar pct={r.progressPercent} showLabel={false} />
              <p style={{ fontSize:13, color:T.textMuted, margin:"12px 0 14px", lineHeight:1.6 }}>{r.summary}</p>
              <div style={{ display:"flex", gap:8 }}>
                <Btn variant="primary" size="sm" onClick={e=>{e.stopPropagation();setSelected(r)}}>عرض التفاصيل</Btn>
              </div>
            </Card>
          ))}
        </div>
        {selected && (
          <Card style={{ padding:"24px", alignSelf:"flex-start", position:"sticky", top:20 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <div style={{ fontSize:16, fontWeight:800, color:T.text }}>تفاصيل التقرير</div>
              <button onClick={()=>setSelected(null)} style={{ background:"none", border:"none", fontSize:18, cursor:"pointer", color:T.textMuted }}>✕</button>
            </div>
            <Avatar name={selected.childName} size={52} />
            <div style={{ marginTop:12, marginBottom:16 }}>
              <div style={{ fontSize:18, fontWeight:900, color:T.text }}>{selected.childName}</div>
              <div style={{ fontSize:11, color:T.textLight, marginTop:2 }}>{selected.date}</div>
            </div>
            <div style={{ padding:"14px", borderRadius:12, background:T.surfaceAlt, marginBottom:16 }}>
              <div style={{ fontSize:12, color:T.textMuted, marginBottom:8 }}>نسبة التقدم</div>
              <ProgressBar pct={selected.progressPercent} />
            </div>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:12, fontWeight:700, color:T.textMuted, marginBottom:8 }}>الملخص</div>
              <p style={{ fontSize:13, color:T.text, lineHeight:1.7, margin:0 }}>{selected.summary}</p>
            </div>
            {selected.recommendations.length > 0 && (
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:12, fontWeight:700, color:T.textMuted, marginBottom:10 }}>التوصيات</div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {selected.recommendations.map((rec,i) => (
                    <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"10px 12px", borderRadius:10, background:T.primaryBg }}>
                      <span style={{ color:T.primary, fontWeight:800 }}>•</span>
                      <span style={{ fontSize:13, color:T.text, lineHeight:1.5 }}>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
      {showModal && (
        <NewReportModal cases={cases} onClose={()=>setShowModal(false)} onCreate={createReport} />
      )}
    </div>
  );
}

// ─── Layout ─────────────────────────────────────────────────────────────────
function Layout({ children, active, onNav, specialist }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNav = (id) => { onNav(id); setMenuOpen(false); };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div style={{ padding:"22px 18px 18px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:T.primary, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:900, color:"#fff" }}>ت</div>
            <div>
              <div style={{ fontSize:17, fontWeight:900, color:"#fff", lineHeight:1 }}>تواصل</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.45)", marginTop:2 }}>بوابة الأخصائيين</div>
            </div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex:1, padding:"14px 10px", display:"flex", flexDirection:"column", gap:4 }}>
        {NAV.map(item => {
          const isActive = active === item.id;
          return (
            <button key={item.id} onClick={() => handleNav(item.id)} style={{
              display:"flex", alignItems:"center", gap:10, padding:"12px 14px", borderRadius:10, border:"none",
              background:isActive?T.sidebarActive:"transparent",
              color:isActive?"#fff":"rgba(255,255,255,0.6)",
              fontSize:14, fontWeight:isActive?700:500, cursor:"pointer",
              fontFamily:"inherit", textAlign:"right", width:"100%",
              transition:"background 0.15s",
            }}>
              <span style={{ fontSize:16 }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ padding:"14px 14px 20px", borderTop:"1px solid rgba(255,255,255,0.08)", display:"flex", alignItems:"center", gap:10 }}>
        <Avatar name={specialist?.name || "..."} size={34} />
        <div style={{ overflow:"hidden" }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#fff", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{specialist?.name || "..."}</div>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>{specialist?.specialization || ""}</div>
        </div>
      </div>
    </>
  );

  return (
    <div style={{ display:"flex", minHeight:"100vh", fontFamily:"'Tajawal',sans-serif", direction:"rtl", background:T.bg }}>

      {/* ── Desktop sidebar ── */}
      <aside className="desktop-sidebar" style={{
        width:196, flexShrink:0, background:T.sidebar,
        display:"flex", flexDirection:"column",
        position:"sticky", top:0, height:"100vh",
      }}>
        <SidebarContent />
      </aside>

      {/* ── Mobile overlay ── */}
      {menuOpen && (
        <div onClick={() => setMenuOpen(false)} style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,0.45)",
          zIndex:40, display:"none",
        }} className="mobile-overlay" />
      )}

      {/* ── Mobile drawer ── */}
      <aside className="mobile-drawer" style={{
        position:"fixed", top:0, right:0, height:"100vh", width:240,
        background:T.sidebar, zIndex:50,
        display:"none", flexDirection:"column",
        transform: menuOpen ? "translateX(0)" : "translateX(100%)",
        transition:"transform 0.28s cubic-bezier(.4,0,.2,1)",
        boxShadow:"-4px 0 24px rgba(0,0,0,0.25)",
      }}>
        {/* Close button inside drawer */}
        <button onClick={() => setMenuOpen(false)} style={{
          position:"absolute", top:16, left:16,
          background:"rgba(255,255,255,0.1)", border:"none", borderRadius:8,
          color:"#fff", fontSize:18, cursor:"pointer", width:34, height:34,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>✕</button>
        <SidebarContent />
      </aside>

      {/* ── Main ── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>

        {/* Mobile top bar */}
        <header className="mobile-topbar" style={{
          display:"none", alignItems:"center", justifyContent:"space-between",
          padding:"14px 16px", background:T.sidebar,
          position:"sticky", top:0, zIndex:30,
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:30, height:30, borderRadius:8, background:T.primary, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:900, color:"#fff" }}>ت</div>
            <span style={{ fontSize:15, fontWeight:900, color:"#fff" }}>تواصل</span>
          </div>
          {/* Burger */}
          <button onClick={() => setMenuOpen(o => !o)} style={{
            background:"rgba(255,255,255,0.1)", border:"none", borderRadius:8,
            width:36, height:36, cursor:"pointer",
            display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:5,
          }}>
            <span style={{ display:"block", width:18, height:2, background:"#fff", borderRadius:2 }}/>
            <span style={{ display:"block", width:18, height:2, background:"#fff", borderRadius:2 }}/>
            <span style={{ display:"block", width:18, height:2, background:"#fff", borderRadius:2 }}/>
          </button>
        </header>

        <main style={{ flex:1, overflow:"auto" }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-topbar   { display: flex !important; }
          .mobile-drawer   { display: flex !important; }
          .mobile-overlay  { display: block !important; }
          /* tighten page padding on mobile */
          main > div { padding: 16px 14px 32px !important; }
          /* stack overview grids */
          main > div > div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function SpecialistDashboard() {
  const [section, setSection] = useState("overview");
  const {
    specialist, cases, sessionsToday, reports, loading, error,
    createSession, updateSessionStatus, createReport,
  } = useTawaslDashboardData();

  const pages = {
    overview: <OverviewPage onNavigate={setSection} cases={cases} sessionsToday={sessionsToday} />,
    cases:    <CasesPage cases={cases} />,
    sessions: <SessionsPage sessionsToday={sessionsToday} cases={cases} createSession={createSession} updateSessionStatus={updateSessionStatus} />,
    reports:  <ReportsPage reports={reports} cases={cases} createReport={createReport} />,
  };
  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:6px}::-webkit-scrollbar-thumb{background:#D0CCC4;border-radius:99px}button:active{opacity:0.8}@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}}`}</style>
      <Layout active={section} onNav={setSection} specialist={specialist}>
        {loading ? (
          <div style={{ padding:60, textAlign:"center", color:T.textMuted, fontFamily:"'Tajawal',sans-serif" }}>
            {error ? `حصل خطأ: ${error}` : "بنجهّز بياناتك..."}
          </div>
        ) : pages[section]}
      </Layout>
    </>
  );
}
