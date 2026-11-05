import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { loadOperations } from '../services/operations';
import { verifySessionAccount, signOutCurrentDevice } from '../services/sessionAccount';
import './OperationsDashboard.css';

const metrics = [
  ['families', 'حسابات أولياء الأمور'], ['specialists', 'حسابات الأخصائيين'],
  ['children', 'ملفات الأطفال'], ['sessions', 'إجمالي الجلسات'],
  ['scheduled', 'جلسات مجدولة'], ['completed', 'جلسات مكتملة'], ['cancelled', 'جلسات ملغاة'],
];
const number = new Intl.NumberFormat('ar-EG');

function SessionAccount({ userId }) {
  const [identity, setIdentity] = useState(null);
  const [checking, setChecking] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    verifySessionAccount(supabase, userId).then(value => {
      if (active) { setIdentity(value); setChecking(false); }
    });
    return () => { active = false; };
  }, [userId]);

  async function signOut() {
    if (pending) return;
    setPending(true);
    setError('');
    try {
      await signOutCurrentDevice(supabase);
      // Discard rendered account data and in-flight responses after logout.
      window.location.replace('/operations');
    } catch {
      setError('تعذر تسجيل الخروج. حاول مرة أخرى.');
      setPending(false);
    }
  }

  return <section className="operations-notice" aria-label="الحساب الحالي">
    <h2>الحساب الحالي</h2>
    {checking ? <p role="status">جاري التحقق من هوية الحساب…</p> : identity ? <>
      <p>البريد الإلكتروني: <bdi>{identity.email || 'غير متاح'}</bdi></p>
      <details><summary>معرّف الحساب</summary><p><bdi>{identity.id}</bdi></p></details>
    </> : <p role="alert">تعذر التحقق من هوية الحساب. أعد تحميل الصفحة أو سجّل خروجك.</p>}
    <button type="button" onClick={signOut} disabled={pending}>
      {pending ? 'جاري تسجيل الخروج…' : 'تسجيل الخروج من هذا الجهاز'}
    </button>
    {error && <p role="alert">{error}</p>}
  </section>;
}

function OperationsContent({ userId }) {
  const [result, setResult] = useState({ status: 'loading' });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    loadOperations(supabase).then(value => {
      if (active) setResult({ ...value, fetchedAt: new Date() });
    });
    return () => { active = false; };
  }, [userId, revision]);

  function refresh() {
    setResult({ status: 'loading' });
    setRevision(value => value + 1);
  }
  return <>
    <div className="operations-toolbar">
      <p>نظرة تشغيلية على الحسابات والجلسات المسجلة في تواصل.</p>
      <button onClick={refresh} disabled={result.status === 'loading'}>تحديث البيانات</button>
    </div>
    {result.status === 'loading' && <p role="status">جاري التحقق من صلاحياتك وتحميل البيانات…</p>}
    {result.status === 'denied' && <section className="operations-notice" role="alert">
      <h2>هذه المساحة لفريق إدارة تواصل</h2>
      <p>حسابك غير مكلّف بإدارة التشغيل. تواصل مع مسؤول المنصة لمنحك الصلاحية المناسبة.</p>
    </section>}
    {result.status === 'unavailable' && <section className="operations-notice" role="status">
      <h2>لوحة التشغيل لم تُفعّل بعد</h2>
      <p>إعداد الوصول الإداري في قاعدة البيانات لم يكتمل بعد. لا توجد بيانات متاحة للعرض حاليًا.</p>
    </section>}
    {result.status === 'error' && <p className="operations-notice" role="alert">تعذر تحميل البيانات. جرّب التحديث، وإذا استمرت المشكلة تواصل مع مسؤول المنصة.</p>}
    {result.status === 'ready' && <>
      <p className="operations-updated">آخر تحديث: {result.fetchedAt.toLocaleString('ar-EG')}</p>
      <div className="operations-metrics">{metrics.map(([key, label]) => <article key={key}>
        <h2>{label}</h2><strong>{number.format(result.data[key])}</strong>
      </article>)}</div>
      <section className="operations-notice">
        <h2>قراءة المؤشرات</h2>
        <p>الأعداد تشمل السجلات الحالية لكل الفترات. عدد حسابات الأخصائيين لا يعني اعتمادهم المهني، وحالة الجلسة المسجلة لا تثبت الحضور الفعلي أو التحسن العلاجي.</p>
        <p>هذه اللوحة تعرض إجماليات التشغيل؛ لا تعرض أسماء الأطفال أو التقارير العلاجية.</p>
      </section>
    </>}
  </>;
}

export default function OperationsDashboard() {
  const { user, loading, error } = useAuth();
  return <main className="operations" dir="rtl">
    <header><div><span className="operations-brand">تواصل · إدارة الشركة</span><h1>متابعة التشغيل</h1></div><Link to="/">الصفحة الرئيسية</Link></header>
    {user && <SessionAccount key={user.id} userId={user.id} />}
    {loading ? <p role="status">جاري تحميل حسابك…</p> : error ? <p role="alert">تعذر التحقق من حسابك. <Link to="/complete-profile">إعادة المحاولة</Link></p> : !user ?
      <section className="operations-notice"><h2>سجّل دخولك للمتابعة</h2><p>الوصول متاح فقط للحسابات المصرّح لها بإدارة التشغيل.</p><Link to="/auth" state={{ from: { pathname: "/operations" } }}>تسجيل الدخول</Link></section> :
      <OperationsContent key={user.id} userId={user.id} />}
  </main>;
}
