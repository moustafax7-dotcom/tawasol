import { useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from "../supabaseClient";
import { callbackNotice } from "../services/socialLogin";
import { SPECIALTIES } from "../services/authService";
import { DASHBOARD_BY_ROLE, getAuthDestination } from '../services/authPolicy';

export default function ProfileRecovery() {
  const { user, profile, loading, error, retryProfile, logout } = useAuth();
  const [logoutError, setLogoutError] = useState('');
  const [params] = useSearchParams();
  const [notice] = useState(() => callbackNotice(window.location.search, window.location.hash));
  const [role, setRole] = useState('parent');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  async function complete(event) {
    event.preventDefault();
    if (saving) return;
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setSaveError('');
    try {
      const { error: failure } = await supabase.rpc('complete_social_profile', {
        p_name: form.get('name').trim(), p_role: role, p_specialty: form.get('specialty'),
      });
      if (failure) throw failure;
      retryProfile();
    } catch {
      setSaveError('تعذر تأكيد حفظ الملف. أعد تحميل الحساب قبل المحاولة مرة أخرى.');
    } finally { setSaving(false); }
  }
  if (notice) return <Navigate to="/auth" replace state={{ socialNotice: notice, from: { pathname: params.get("next") } }} />;
  if (loading) return <main dir="rtl" role="status" style={{ padding: 32 }}>جاري تحميل حسابك…</main>;
  if (!user && !error) return <Navigate to="/auth" replace />;
  if (!error && DASHBOARD_BY_ROLE[profile?.role]) return <Navigate to={getAuthDestination(profile.role, params.get("next"))} replace />;

  const needsSetup = !error && !profile?.role && user?.app_metadata?.providers?.some(provider => ['google', 'facebook'].includes(provider));
  async function handleLogout() {
    setLogoutError('');
    try { await logout(); } catch { setLogoutError('تعذر تسجيل الخروج. حاول مرة أخرى.'); }
  }

  return <main dir="rtl" style={{ maxWidth: 600, margin: '64px auto', padding: 24, lineHeight: 1.8 }}>
    {needsSetup ? <form onSubmit={complete} style={{ display: 'grid', gap: 12 }}>
      <h1>كمّل بيانات حسابك</h1>
      <label>الاسم <input name="name" required maxLength={120} defaultValue={user.user_metadata?.full_name || ''} /></label>
      <label>نوع الحساب <select value={role} onChange={e => setRole(e.target.value)}>
        <option value="parent">ولي أمر</option><option value="specialist">طبيب أو أخصائي</option>
      </select></label>
      {role === 'specialist' && <label>التخصص <select name="specialty" required>
        {SPECIALTIES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select></label>}
      {saveError && <p role="alert">{saveError}</p>}
      <button disabled={saving}>{saving ? 'جاري الحفظ…' : 'حفظ وفتح اللوحة'}</button>
    </form> : <><h1>تعذر فتح ملف الحساب</h1>
    <p role="alert">{error ? 'تعذر تحميل بيانات حسابك. تحقق من الاتصال ثم أعد المحاولة.' : 'حساب الدخول موجود، لكن ملفك أو نوع حسابك لم يكتمل بعد. يلزم مراجعة إعداد الحساب مع إدارة المنصة.'}</p>
    <p>لا تحتاج إلى إنشاء حساب جديد. هذه الصفحة لا تغيّر دور الحساب أو صلاحياته.</p></> }
    <button type="button" onClick={retryProfile}>إعادة المحاولة</button>{' '}
    {user && <button type="button" onClick={handleLogout}>تسجيل الخروج</button>}
    {logoutError && <p role="alert">{logoutError}</p>}
    <p><Link to="/">الرجوع للرئيسية</Link></p>
  </main>;
}
