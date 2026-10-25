export const DASHBOARD_BY_ROLE = Object.freeze(Object.assign(Object.create(null), { parent: '/parent', specialist: '/tawasl' }));

export function getAuthDestination(role, from) {
  const home = DASHBOARD_BY_ROLE[role];
  if (!home) return '/complete-profile';
  // Operations data is authorized separately by the membership-gated RPC.
  const allowed = role === 'parent' ? ['/parent', '/kids', '/operations'] : ['/tawasl', '/operations'];
  return allowed.includes(from) ? from : home;
}

const messages = {
  invalid_credentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
  user_already_exists: 'هذا البريد الإلكتروني مستخدم بالفعل.',
  email_exists: 'هذا البريد الإلكتروني مستخدم بالفعل.',
  email_not_confirmed: 'برجاء تأكيد بريدك الإلكتروني من الرسالة التي وصلتك قبل تسجيل الدخول.',
  weak_password: 'كلمة المرور ضعيفة، استخدم كلمة مرور أطول وأكثر تنوعًا.',
  invalid_email: 'صيغة البريد الإلكتروني غير صحيحة.',
  over_request_rate_limit: 'محاولات كثيرة خلال وقت قصير. انتظر قليلًا ثم حاول مرة أخرى.',
  over_email_send_rate_limit: 'تم تجاوز عدد رسائل التأكيد المسموح. انتظر قليلًا ثم حاول مرة أخرى.',
  signup_disabled: 'إنشاء الحسابات متوقف حاليًا. تواصل مع إدارة المنصة.',
  unexpected_failure: 'تعذر إتمام التسجيل. حاول لاحقًا أو تواصل مع إدارة المنصة.',
  profile_unavailable: 'تم التحقق من الدخول، لكن تعذر تحميل ملفك. حاول مرة أخرى دون إنشاء حساب جديد.',
};

export function getAuthErrorMessage(code) {
  return (Object.hasOwn(messages, code) ? messages[code] : null) || 'تعذر إتمام العملية. تحقق من اتصالك وحاول مرة أخرى.';
}

export function normalizeAuthError(error) {
  if (error?.code) return error;
  const message = String(error?.message || '');
  const code = /email not confirmed/i.test(message) ? 'email_not_confirmed'
    : /invalid login credentials/i.test(message) ? 'invalid_credentials'
    : /already registered/i.test(message) ? 'user_already_exists' : 'default';
  return Object.assign(new Error(getAuthErrorMessage(code)), { code });
}
