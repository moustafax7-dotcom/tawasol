export async function addFamilyChild(client, parentId, { fullName, age }) {
  const name = typeof fullName === 'string' ? fullName.trim() : '';
  if (!parentId || !name || name.length > 120 || !Number.isInteger(age) || age < 1 || age > 120) {
    return { error: 'اكتب اسم الطفل وعمرًا صحيحًا بالسنوات.' };
  }
  try {
    const { data, error } = await client.from('children')
      .insert({ parent_id: parentId, full_name: name, age })
      .select('id, parent_id, full_name, age, created_at').single();
    if (error || !data?.id || data.parent_id !== parentId) {
      return { error: 'تعذر تأكيد إضافة الطفل. حدّث القائمة قبل إعادة المحاولة.' };
    }
    return { data, error: null };
  } catch {
    return { error: 'تعذر تأكيد الحفظ بسبب الاتصال. حدّث القائمة قبل إعادة المحاولة لتجنب التكرار.' };
  }
}

export async function loadChildAppointments(client, { parentId, childId, page = 0 }) {
  if (!parentId || !childId || !Number.isInteger(page) || page < 0) return { status: 'error' };
  try {
    // Ownership is checked again before reading; server RLS remains authoritative.
    const child = await client.from('children').select('id')
      .eq('id', childId).eq('parent_id', parentId).maybeSingle();
    if (child.error) return { status: 'error' };
    if (!child.data || child.data.id !== childId) return { status: 'denied' };
    const { data, error } = await client.from('sessions')
      .select('id, child_id, session_date, session_time, duration_minutes, type, status')
      .eq('child_id', childId).order('session_date', { ascending: false })
      .order('session_time', { ascending: false }).order('id', { ascending: true })
      .range(page * 20, page * 20 + 20);
    if (error || !Array.isArray(data) || data.some(row => row.child_id !== childId)) return { status: 'error' };
    return { status: 'ready', rows: data.slice(0, 20), hasMore: data.length > 20 };
  } catch {
    return { status: 'error' };
  }
}
