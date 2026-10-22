import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DASHBOARD_BY_ROLE } from '../services/authPolicy';

export default function ProfileRecovery() {
  const { user, profile, loading, error, retryProfile, logout } = useAuth();
  const [logoutError, setLogoutError] = useState('');
  if (loading) return <main dir="rtl" role="status" style={{ padding: 32 }}>جاري تحميل حسابك…</main>;
  if (!user && !error) return <Navigate to="/auth" replace />;
  if (!error && DASHBOARD_BY_ROLE[profile?.role]) return <Navigate to={DASHBOARD_BY_ROLE[profile.role]} replace />;

  async function handleLogout() {
    setLogoutError('');
    try { await logout(); } catch { setLogoutError('تعذر تسجيل الخروج. حاول مرة أخرى.'); }
  }

  return <main dir="rtl" style={{ maxWidth: 600, margin: '64px auto', padding: 24, lineHeight: 1.8 }}>
    <h1>تعذر فتح ملف الحساب</h1>
    <p role="alert">{error ? 'تعذر تحميل بيانات حسابك. تحقق من الاتصال ثم أعد المحاولة.' : 'حساب الدخول موجود، لكن ملفك أو نوع حسابك لم يكتمل بعد. يلزم مراجعة إعداد الحساب مع إدارة المنصة.'}</p>
    <p>لا تحتاج إلى إنشاء حساب جديد. هذه الصفحة لا تغيّر دور الحساب أو صلاحياته.</p>
    <button type="button" onClick={retryProfile}>إعادة المحاولة</button>{' '}
    {user && <button type="button" onClick={handleLogout}>تسجيل الخروج</button>}
    {logoutError && <p role="alert">{logoutError}</p>}
    <p><Link to="/">الرجوع للرئيسية</Link></p>
  </main>;
}
