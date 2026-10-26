import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { loadChildAppointments } from '../services/family';

const statuses = { scheduled: 'مجدولة', in_progress: 'جارية', completed: 'مكتملة', cancelled: 'ملغاة' };

export default function FamilyAppointments({ parentId, childId, theme: T }) {
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState(null);
  const requestKey = `${parentId}:${childId}:${page}:${revision}`;
  useEffect(() => {
    let active = true;
    loadChildAppointments(supabase, { parentId, childId, page }).then(value => {
      if (active) setResult({ ...value, requestKey });
    });
    return () => { active = false; };
  }, [parentId, childId, page, requestKey]);
  const current = result?.requestKey === requestKey ? result : null;
  const buttonStyle = { padding: '10px 14px', borderRadius: 12, border: `1px solid ${T.border}`, background: T.surface, color: T.text, font: 'inherit', cursor: 'pointer', minHeight: 44 };

  return <section aria-labelledby="family-appointments-title" style={{ padding: 20, borderRadius: 20, background: T.surface, border: `1px solid ${T.border}` }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
      <h2 id="family-appointments-title" style={{ fontSize: 18, color: T.text }}>مواعيد الطفل</h2>
      <button type="button" style={buttonStyle} disabled={!current} onClick={() => setRevision(value => value + 1)}>تحديث المواعيد</button>
    </div>
    <p style={{ marginBlock: 12, fontSize: 13, color: T.text }}>الأحدث أولًا. الوقت معروض كما سجّله الأخصائي؛ تأكد معه من توقيت الموعد.</p>
    {!current ? <p role="status">جاري تحميل المواعيد…</p> : current.status !== 'ready' ? <p role="alert">تعذر تحميل المواعيد. تأكد من الاتصال وصلاحية الوصول ثم أعد المحاولة.</p> : current.rows.length === 0 ? <p>لا توجد مواعيد في هذه الصفحة.</p> :
      <ul style={{ display: 'grid', gap: 12, padding: 0, listStyle: 'none' }}>{current.rows.map(session => <li key={session.id} style={{ padding: 14, borderRadius: 12, background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <strong>{session.type || 'جلسة متابعة'}</strong>
          <span>{statuses[session.status] || 'حالة غير محددة'}</span>
        </div>
        <p style={{ marginTop: 8 }}>التاريخ: <bdi>{session.session_date || 'غير محدد'}</bdi> · الوقت: <bdi>{session.session_time || 'غير محدد'}</bdi></p>
        {session.duration_minutes != null && <p>المدة: {session.duration_minutes} دقيقة</p>}
      </li>)}</ul>}
    <nav aria-label="صفحات المواعيد" style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 14 }}>
      <button type="button" style={buttonStyle} disabled={!current || page === 0} onClick={() => setPage(value => value - 1)}>السابق</button>
      <span>صفحة {page + 1}</span>
      <button type="button" style={buttonStyle} disabled={!current || current.status !== 'ready' || !current.hasMore} onClick={() => setPage(value => value + 1)}>التالي</button>
    </nav>
  </section>;
}
