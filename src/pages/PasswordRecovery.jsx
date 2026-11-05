import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import InputField from '../components/InputField';
import { supabase } from '../supabaseClient';
import { getAuthErrorMessage } from '../services/authPolicy';
import styles from './Auth.module.css';

export default function PasswordRecovery({ reset = false }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(reset);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!reset) return;
    let active = true;
    // getUser waits for auth initialization and validates the session with Auth.
    supabase.auth.getUser().then(({ data, error: authError }) => {
      if (!active) return;
      setAuthorized(!authError && Boolean(data.user));
      setChecking(false);
    }).catch(() => {
      if (active) { setChecking(false); setAuthorized(false); }
    });
    return () => { active = false; };
  }, [reset]);

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setError('');
    setMessage('');
    if (reset && (!authorized || password.length < 8 || password !== confirmation)) {
      setError(!authorized ? 'افتح رابط الاستعادة من بريدك أولًا.' : password.length < 8 ? 'استخدم كلمة مرور من 8 أحرف على الأقل.' : 'كلمتا المرور غير متطابقتين.');
      return;
    }
    setBusy(true);
    try {
      const result = reset
        ? await supabase.auth.updateUser({ password })
        : await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/auth/reset-password` });
      if (result.error) throw result.error;
      setPassword('');
      setConfirmation('');
      setMessage(reset ? 'تم تغيير كلمة المرور بنجاح. يمكنك العودة لتسجيل الدخول.' : 'إذا كان البريد مرتبطًا بحساب، ستصلك رسالة الاستعادة. راجع أيضًا البريد غير المرغوب فيه.');
    } catch (failure) {
      setError(getAuthErrorMessage(failure.code));
    } finally {
      setBusy(false);
    }
  }

  return <main className={styles.page}>
    <section className={styles.card} aria-labelledby="recovery-title">
      <h1 id="recovery-title">{reset ? 'كلمة مرور جديدة' : 'استعادة كلمة المرور'}</h1>
      {checking ? <p role="status">جاري التحقق من رابط الاستعادة...</p> : reset && !authorized ? <div role="alert">
        <p>الرابط غير صالح أو انتهت صلاحيته. اطلب رسالة جديدة لاستعادة حسابك.</p>
        <Link to="/auth/forgot-password">طلب رابط جديد</Link>
      </div> : <form onSubmit={submit}>
        {!reset && <InputField label="البريد الإلكتروني" type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" required />}
        {reset && <>
          <InputField label="كلمة المرور الجديدة" type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="new-password" required />
          <InputField label="تأكيد كلمة المرور" type="password" value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="new-password" required />
        </>}
        {error && <p role="alert">{error}</p>}
        {message && <p role="status">{message}</p>}
        <button className={styles.submitBtn} type="submit" disabled={busy || Boolean(message)}>{busy ? 'جاري التنفيذ...' : reset ? 'حفظ كلمة المرور' : 'إرسال رابط الاستعادة'}</button>
      </form>}
      <p><Link to="/auth">العودة لتسجيل الدخول</Link></p>
    </section>
  </main>;
}
