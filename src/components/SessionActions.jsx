import { useRef, useState } from 'react';

export default function SessionActions({ session, onUpdate, onMove, theme: T }) {
  const [confirming, setConfirming] = useState(false);
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const buttonStyle = { padding: '8px 12px', minHeight: 44, borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface, color: T.text, font: 'inherit', cursor: 'pointer' };

  async function submit(action) {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setError('');
    try {
      const result = await action();
      if (result?.error) setError(result.error);
      else { setConfirming(false); setEditing(false); }
    } catch {
      setError('تعذر تأكيد التحديث. حدّث القائمة قبل المحاولة مرة أخرى.');
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  if (!['قادمة', 'جارية'].includes(session.status)) return null;
  return <div style={{ display: 'grid', gap: 8 }} aria-busy={pending}>
    {editing ? <form style={{ display: 'grid', gap: 8 }} onSubmit={event => {
      event.preventDefault();
      const values = new FormData(event.currentTarget);
      submit(() => onMove(session, values.get('date'), values.get('time')));
    }}>
      <strong>تعديل موعد {session.childName}</strong>
      <label>التاريخ الجديد <input required type="date" name="date" defaultValue={session.date} /></label>
      <label>الوقت بتوقيت القاهرة <input required type="time" name="time" defaultValue={session.time?.slice(0, 5)} /></label>
      <button type="submit" style={buttonStyle} disabled={pending}>حفظ الموعد</button>
      <button type="button" style={buttonStyle} disabled={pending} onClick={() => { setEditing(false); setError(''); }}>رجوع</button>
    </form> : confirming ? <div role="group" aria-label="تأكيد إلغاء الجلسة">
      <p style={{ fontSize: 13, marginBottom: 8 }}>إلغاء جلسة {session.childName} الساعة {session.time}؟</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button type="button" style={buttonStyle} disabled={pending} onClick={() => submit(() => onUpdate(session.id, 'cancelled'))}>تأكيد الإلغاء</button>
        <button type="button" style={buttonStyle} disabled={pending} onClick={() => setConfirming(false)}>الاحتفاظ بالموعد</button>
      </div>
    </div> : <div style={{ display: 'flex', gap: 8 }}>
      {session.status === 'قادمة' && <>
        <button type="button" style={buttonStyle} disabled={pending} onClick={() => { setEditing(true); setError(''); }}>تعديل الموعد</button>
        <button type="button" style={buttonStyle} disabled={pending} onClick={() => setConfirming(true)}>إلغاء</button>
        <button type="button" style={buttonStyle} disabled={pending} onClick={() => submit(() => onUpdate(session.id, 'in_progress'))}>بدء</button>
      </>}
      {session.status === 'جارية' && <button type="button" style={buttonStyle} disabled={pending} onClick={() => submit(() => onUpdate(session.id, 'completed'))}>إنهاء</button>}
    </div>}
    {pending && <span role="status">جاري تحديث الجلسة…</span>}
    {error && <p role="alert">{error}</p>}
  </div>;
}
