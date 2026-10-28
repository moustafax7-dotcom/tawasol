export function localDateInput(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// Local scheduling until the schema stores an explicit clinic timezone.
export function validateSession({ childId, date, time, duration, type }, now = new Date()) {
  if (!childId) return 'اختار الطفل قبل الحجز.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time || '')) {
    return 'اختار تاريخًا ووقتًا صحيحين للجلسة.';
  }
  const startsAt = new Date(`${date}T${time}:00`);
  if (!Number.isFinite(startsAt.getTime()) || localDateInput(startsAt) !== date) return 'تاريخ الجلسة غير صحيح.';
  if (startsAt <= now) return 'اختار موعدًا قادمًا للجلسة.';
  if (!Number.isInteger(duration) || duration < 5 || duration > 240) return 'مدة الجلسة من 5 إلى 240 دقيقة.';
  if (!['ABA', 'PECS', 'Speech', 'متابعة العلاج'].includes(type)) return 'اختار نوع الجلسة من القائمة.';
  return null;
}
