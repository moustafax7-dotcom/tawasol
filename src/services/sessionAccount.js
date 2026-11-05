export async function verifySessionAccount(client, expectedUserId) {
  try {
    const { data, error } = await client.auth.getUser();
    if (error || !data?.user?.id || data.user.id !== expectedUserId) return null;
    // Return only account identity, never the session or credentials.
    return { id: data.user.id, email: data.user.email || '' };
  } catch {
    return null;
  }
}

export async function signOutCurrentDevice(client) {
  const { error } = await client.auth.signOut({ scope: 'local' });
  if (error) throw error;
}
