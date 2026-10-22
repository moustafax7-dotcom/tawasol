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
