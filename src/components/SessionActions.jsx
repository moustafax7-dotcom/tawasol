import { useRef, useState } from 'react';

export default function SessionActions({ session, onUpdate, theme: T }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const buttonStyle = { padding: '8px 12px', minHeight: 44, borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface, color: T.text, font: 'inherit', cursor: 'pointer' };

  async function changeStatus(status) {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setError('');
    try {
      const result = await onUpdate(session.id, status);
      if (result?.error) setError(result.error);
      else setConfirming(false);
    } catch {
      setError('تعذر تأكيد التحديث. حدّث القائمة قبل المحاولة مرة أخرى.');
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  if (!['قادمة', 'جارية'].includes(session.status)) return null;
  return <div style={{ display: 'grid', gap: 8 }} aria-busy={pending}>
    {confirming ? <div role="group" aria-label="تأكيد إلغاء الجلسة">
      <p style={{ fontSize: 13, marginBottom: 8 }}>إلغاء جلسة {session.childName} الساعة {session.time}؟</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button type="button" style={buttonStyle} disabled={pending} onClick={() => changeStatus('cancelled')}>تأكيد الإلغاء</button>
        <button type="button" style={buttonStyle} disabled={pending} onClick={() => setConfirming(false)}>الاحتفاظ بالموعد</button>
      </div>
    </div> : <div style={{ display: 'flex', gap: 8 }}>
      {session.status === 'قادمة' && <>
        <button type="button" style={buttonStyle} disabled={pending} onClick={() => setConfirming(true)}>إلغاء</button>
        <button type="button" style={buttonStyle} disabled={pending} onClick={() => changeStatus('in_progress')}>بدء</button>
      </>}
      {session.status === 'جارية' && <button type="button" style={buttonStyle} disabled={pending} onClick={() => changeStatus('completed')}>إنهاء</button>}
    </div>}
    {pending && <span role="status">جاري تحديث الجلسة…</span>}
    {error && <p role="alert">{error}</p>}
  </div>;
}
