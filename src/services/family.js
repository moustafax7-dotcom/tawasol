export const appointmentStatuses = { scheduled: 'مجدولة', in_progress: 'جارية', completed: 'مكتملة', cancelled: 'ملغاة' };

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateAppointmentFilters({ status = '', from = '', to = '', sort = 'newest' }) {
  if (status && !Object.hasOwn(appointmentStatuses, status)) return 'اختار حالة من القائمة.';
  if ((from && !validDate(from)) || (to && !validDate(to))) return 'اكتب تاريخًا صحيحًا.';
  if (from && to && from > to) return 'تاريخ البداية لازم يكون قبل تاريخ النهاية أو مساويًا له.';
  if (!['newest', 'oldest'].includes(sort)) return 'اختار ترتيبًا من القائمة.';
  return null;
}

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

export async function loadChildAppointments(client, { parentId, childId, page = 0, status = '', from = '', to = '', sort = 'newest' }) {
  if (!parentId || !childId || !Number.isInteger(page) || page < 0) return { status: 'error' };
  if (validateAppointmentFilters({ status, from, to, sort })) return { status: 'error' };
  try {
    // Ownership is checked again before reading; server RLS remains authoritative.
    const child = await client.from('children').select('id')
      .eq('id', childId).eq('parent_id', parentId).maybeSingle();
    if (child.error) return { status: 'error' };
    if (!child.data || child.data.id !== childId) return { status: 'denied' };
    let query = client.from('sessions')
      .select('id, child_id, session_date, session_time, duration_minutes, type, status')
      .eq('child_id', childId);
    if (status) query = query.eq('status', status);
    if (from) query = query.gte('session_date', from);
    if (to) query = query.lte('session_date', to);
    const { data, error } = await query.order('session_date', { ascending: sort === 'oldest' })
      .order('session_time', { ascending: sort === 'oldest' }).order('id', { ascending: true })
      .range(page * 20, page * 20 + 20);
    if (error || !Array.isArray(data) || data.some(row => row.child_id !== childId)) return { status: 'error' };
    return { status: 'ready', rows: data.slice(0, 20), hasMore: data.length > 20 };
  } catch {
    return { status: 'error' };
  }
}
