// A rejected request can have an unknown server outcome. Do not auto-retry inserts.
export async function saveSpecialistRecord(client, table, record) {
  if (!['sessions', 'reports'].includes(table)) throw new Error('Unsupported specialist record');
  try {
    const { error } = await client.from(table).insert(record);
    if (table === 'sessions' && error?.code === '22023') return { error: 'اختار موعدًا قادمًا وصحيحًا بتوقيت القاهرة.' };
    if (table === 'sessions' && error?.code === '23P01') return { error: 'الموعد يتعارض مع جلسة أخرى. اختار وقتًا مختلفًا.' };
    if (error) return { error: 'تعذر حفظ البيانات. تحقق من البيانات وصلاحية الوصول ثم حاول مرة أخرى.' };
    return { error: null };
  } catch {
    return { error: 'تعذر تأكيد الحفظ بسبب الاتصال. تحقق من القائمة قبل إعادة المحاولة لتجنب التكرار.' };
  }
}

export async function saveSessionStatus(client, { sessionId, specialistId, status }) {
  if (!sessionId || !specialistId || !['in_progress', 'completed', 'cancelled'].includes(status)) {
    return { error: 'تعذر تحديد الجلسة أو حالتها.' };
  }
  try {
    const previousStatus = status === 'completed' ? 'in_progress' : 'scheduled';
    const { data, error } = await client.from('sessions').update({ status })
      .eq('id', sessionId).eq('specialist_id', specialistId).eq('status', previousStatus)
      .select('id, status').maybeSingle();
    if (error || !data || data.id !== sessionId || data.status !== status) {
      return { error: 'لم يتم تأكيد التحديث. ربما تغيّرت حالة الجلسة؛ حدّث القائمة قبل المحاولة.' };
    }
    return { error: null };
  } catch {
    return { error: 'تعذر تأكيد حالة الجلسة بسبب الاتصال. حدّث القائمة قبل المحاولة.' };
  }
}

export async function moveSession(client, session, date, time) {
  try {
    const { data, error } = await client.rpc('reschedule_session', {
      p_id: session.id, p_previous_date: session.date, p_previous_time: session.time,
      p_date: date, p_time: time,
    });
    if (error?.code === 'PGRST202') return { error: 'إعادة الجدولة غير متاحة حاليًا.' };
    if (error?.code === '23P01') return { error: 'الموعد يتعارض مع جلسة أخرى. اختار وقتًا مختلفًا.' };
    if (error?.code === '22023') return { error: 'اختار موعدًا قادمًا وصحيحًا بتوقيت القاهرة.' };
    if (error || data !== session.id) return { error: 'تعذر تأكيد التعديل. حدّث قائمة الجلسات وتحقق من الموعد.' };
    return { error: null };
  } catch {
    return { error: 'الاتصال انقطع. تحقق من الموعد قبل إعادة المحاولة.' };
  }
}
