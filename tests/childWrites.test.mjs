import test from 'node:test';
import assert from 'node:assert/strict';
import { saveChildTask } from '../src/services/childWrites.js';

function clientFor(result, calls) {
  const query = {
    update(value) { calls.push(['update', value]); return this; },
    eq(key, value) { calls.push([key, value]); return this; },
    select() { return this; },
    async maybeSingle() { if (result instanceof Error) throw result; return result; },
  };
  return { from(table) { calls.push(['table', table]); return query; } };
}
test('task save scopes the write to the child and confirms the stored state', async () => {
  const calls = [];
  const result = await saveChildTask(clientFor({ data: { id: 'task', done: true } }, calls), { taskId: 'task', childId: 'child', done: true });
  assert.equal(result.error, null);
  assert.deepEqual(calls, [['table', 'daily_tasks'], ['update', { done: true }], ['id', 'task'], ['child_id', 'child']]);
});
for (const [name, response] of [
  ['no matching visible row', { data: null }],
  ['permission denial', { error: { message: 'private database detail' } }],
  ['network failure', new Error('connection lost')],
  ['unexpected stored state', { data: { id: 'task', done: false } }],
]) {
  test(`task save does not claim success after ${name}`, async () => {
    const result = await saveChildTask(clientFor(response, []), { taskId: 'task', childId: 'child', done: true });
    assert.ok(result.error);
    assert.ok(!result.error.includes('private database detail'));
  });
}
test('missing child causes no database request', async () => {
  const calls = [];
  const result = await saveChildTask(clientFor({}, calls), { taskId: 'task', done: true });
  assert.ok(result.error);
  assert.deepEqual(calls, []);
});

import { saveGameReward } from '../src/services/childWrites.js';
function rewardClient(balance, history = {}, calls = []) {
  return { from(table) {
    const query = {
      update(value) { calls.push(['update', value.coins]); return this; },
      eq(key, value) { calls.push([key, value]); return this; },
      select() { return this; },
      async maybeSingle() { if (balance instanceof Error) throw balance; return balance; },
      async insert() { calls.push(['history']); if (history instanceof Error) throw history; return history; },
    };
    calls.push(['table', table]);
    return query;
  } };
}
const game = { childId: 'child', gameId: 'game', coins: 10, earned: 5, score: 50, level: 1, durationSeconds: 10 };
test('game reward returns only a confirmed balance and compares previous balance', async () => {
  const calls = [];
  const result = await saveGameReward(rewardClient({ data: { coins: 15 } }, {}, calls), game);
  assert.deepEqual(result, { coins: 15, error: null });
  assert.ok(calls.some(([key, value]) => key === 'coins' && value === 10));
  assert.ok(calls.some(([key, value]) => key === 'child_id' && value === 'child'));
});
for (const [name, balance] of [
  ['stale or inaccessible balance', { data: null }],
  ['denied update', { error: { message: 'private detail' } }],
  ['network failure', new Error('offline')],
]) {
  test(`reward does not increase the displayed balance after ${name}`, async () => {
    const calls = [];
    const result = await saveGameReward(rewardClient(balance, {}, calls), game);
    assert.equal(result.coins, undefined);
    assert.ok(result.error);
    assert.ok(!calls.some(([key]) => key === 'history'));
  });
}
for (const history of [{ error: { message: 'denied' } }, new Error('offline')]) {
  test('history failure retains confirmed points and reports partial save', async () => {
    const result = await saveGameReward(rewardClient({ data: { coins: 15 } }, history), game);
    assert.equal(result.coins, 15);
    assert.ok(result.error.includes('تم حفظ النقاط'));
  });
}
test('invalid game or reward performs no writes', async () => {
  for (const invalid of [{ gameId: null }, { earned: -1 }, { earned: NaN }, { coins: Infinity }]) {
    const calls = [];
    const result = await saveGameReward(rewardClient({}, {}, calls), { ...game, ...invalid });
    assert.ok(result.error);
    assert.deepEqual(calls, []);
  }
});

import { saveChildMood } from '../src/services/childWrites.js';
test('mood save reports acknowledged inserts', async () => {
  let row;
  const client = { from(table) {
    assert.equal(table, 'mood_logs');
    return { async insert(value) { row = value; return { error: null }; } };
  } };
  assert.deepEqual(await saveChildMood(client, { childId: 'child', mood: 'happy' }), { error: null });
  assert.equal(row.child_id, 'child');
  assert.equal(row.mood, 'happy');
});
for (const failure of [{ error: { message: 'private detail' } }, new Error('offline')]) {
  test('mood save does not report success on database or network failure', async () => {
    const client = { from: () => ({ async insert() { if (failure instanceof Error) throw failure; return failure; } }) };
    const result = await saveChildMood(client, { childId: 'child', mood: 'sad' });
    assert.ok(result.error);
    assert.ok(!result.error.includes('private detail'));
  });
}
test('invalid mood performs no request', async () => {
  const client = { from() { assert.fail('must not send invalid mood'); } };
  assert.ok((await saveChildMood(client, { childId: 'child', mood: 'unknown' })).error);
  assert.ok((await saveChildMood(client, { mood: 'happy' })).error);
});
