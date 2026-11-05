// Return only IDs confirmed by the database; RLS may update zero rows without error.
export async function persistReadNotifications(client, userId, ids) {
  if (!userId || ids.length === 0) return [];
  const { data, error } = await client.from('notifications')
    .update({ is_read: true }).eq('user_id', userId).in('id', ids).select('id');
  if (error) throw error;
  const confirmed = (data || []).map(item => item.id);
  if (ids.some(id => !confirmed.includes(id))) throw new Error('notification_update_incomplete');
  return confirmed;
}
