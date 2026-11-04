const cairoClock = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

export function localDateInput(now = new Date()) {
  return cairoClock.format(now).slice(0, 10);
}

export function validateSession({ childId, date, time, duration, type }, now = new Date()) {
  if (!childId) return 'اختار الطفل قبل الحجز.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time || '')) {
    return 'اختار تاريخًا ووقتًا صحيحين للجلسة.';
  }
  const calendarDate = new Date(date + 'T12:00:00Z');
  if (!Number.isFinite(calendarDate.getTime()) || calendarDate.toISOString().slice(0, 10) !== date) return 'تاريخ الجلسة غير صحيح.';
  if (date + ' ' + time <= cairoClock.format(now)) return 'اختار موعدًا قادمًا بتوقيت القاهرة.';
  if (!Number.isInteger(duration) || duration < 5 || duration > 240) return 'مدة الجلسة من 5 إلى 240 دقيقة.';
  if (!['ABA', 'PECS', 'Speech', 'متابعة العلاج'].includes(type)) return 'اختار نوع الجلسة من القائمة.';
  return null;
}
