export async function saveChildTask(client, { taskId, childId, done }) {
  if (!taskId || !childId || typeof done !== 'boolean') {
    return { error: 'تعذر تحديد المهمة والطفل.' };
  }
  try {
    const { data, error } = await client.from('daily_tasks')
      .update({ done }).eq('id', taskId).eq('child_id', childId)
      .select('id, done').maybeSingle();
    if (error || !data || data.id !== taskId || data.done !== done) {
      return { error: 'لم يتم تأكيد حفظ المهمة. حدّث البيانات وحاول مرة أخرى.' };
    }
    return { error: null };
  } catch {
    return { error: 'تعذر تأكيد الحفظ بسبب الاتصال. حدّث البيانات قبل إعادة المحاولة.' };
  }
}

// Compare the stored balance before writing; do not overwrite a newer session.
// This is not a transaction: a failed history write is reported separately.
export async function saveGameReward(client, { childId, gameId, coins, earned, score, level, durationSeconds }) {
  if (!childId || !gameId || !Number.isSafeInteger(coins) || coins < 0 ||
      !Number.isSafeInteger(earned) || earned < 0 || !Number.isSafeInteger(coins + earned)) {
    return { error: 'تعذر تحديد اللعبة أو رصيد النقاط. حدّث الصفحة قبل المحاولة.' };
  }
  let confirmedCoins;
  try {
    const total = coins + earned;
    const { data, error } = await client.from('rewards')
      .update({ coins: total, updated_at: new Date().toISOString() })
      .eq('child_id', childId).eq('coins', coins).select('coins').maybeSingle();
    if (error || !data || data.coins !== total) {
      return { error: 'لم يتم تأكيد حفظ النقاط. حدّث الصفحة لمراجعة الرصيد قبل إعادة المحاولة.' };
    }
    confirmedCoins = data.coins;
    const { error: historyError } = await client.from('game_sessions').insert({
      child_id: childId, game_id: gameId, score, duration_seconds: durationSeconds,
      played_at: new Date().toISOString(), raw_data: { level },
    });
    return {
      coins: confirmedCoins,
      error: historyError ? 'تم حفظ النقاط، لكن تعذر تسجيل تفاصيل اللعبة. لا تكرر الحفظ.' : null,
    };
  } catch {
    return {
      coins: confirmedCoins,
      error: confirmedCoins !== undefined
        ? 'تم حفظ النقاط، لكن لم يتأكد حفظ تفاصيل اللعبة بسبب الاتصال. لا تكرر الحفظ.'
        : 'تعذر تأكيد حفظ النقاط بسبب الاتصال. حدّث الصفحة قبل إعادة المحاولة.',
    };
  }
}

export async function saveChildMood(client, { childId, mood }) {
  if (!childId || !['happy', 'calm', 'sad', 'angry'].includes(mood)) {
    return { error: 'اختار شعورك وحدد الطفل قبل الحفظ.' };
  }
  try {
    const { error } = await client.from('mood_logs').insert({
      child_id: childId, mood, source: 'child', logged_at: new Date().toISOString(),
    });
    return { error: error ? 'لم يتم حفظ شعورك. حاول مرة أخرى.' : null };
  } catch {
    return { error: 'تعذر تأكيد الحفظ بسبب الاتصال. راجع متابعة الأسرة قبل إعادة المحاولة.' };
  }
}
