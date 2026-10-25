const keys = ['families', 'specialists', 'children', 'sessions', 'scheduled', 'completed', 'cancelled'];

export async function loadOperations(client) {
  try {
    const { data, error } = await client.rpc('operations_overview');
    if (error) {
      if (error.code === '42501') return { status: 'denied' };
      if (error.code === 'PGRST202') return { status: 'unavailable' };
      return { status: 'error' };
    }
    // Reject incomplete responses: missing data must never appear as zero activity.
    if (!data || keys.some(key => !Number.isSafeInteger(data[key]) || data[key] < 0)) {
      return { status: 'error' };
    }
    return { status: 'ready', data };
  } catch {
    return { status: 'error' };
  }
}
