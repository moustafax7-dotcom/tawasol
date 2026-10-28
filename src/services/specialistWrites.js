// A rejected request can have an unknown server outcome. Do not auto-retry inserts.
export async function saveSpecialistRecord(client, table, record) {
  if (!['sessions', 'reports'].includes(table)) throw new Error('Unsupported specialist record');
  try {
    const { error } = await client.from(table).insert(record);
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
