import test from 'node:test';
import assert from 'node:assert/strict';
import { localDateInput, validateSession } from '../src/utils/sessionValidation.js';
import { saveSessionStatus } from '../src/services/specialistWrites.js';
const now = new Date(2026, 9, 25, 12);
const booking = { childId: 'child', date: '2026-10-26', time: '13:30', duration: 45, type: 'Speech' };
test('valid future booking uses a local calendar date', () => {
  assert.equal(localDateInput(now), '2026-10-25');
  assert.equal(validateSession(booking, now), null);
});
for (const [name, patch] of [
  ['missing child', { childId: '' }], ['impossible date', { date: '2026-02-30' }],
  ['free-form time', { time: '10 صباحاً' }], ['past time', { date: '2026-10-25', time: '11:00' }],
  ['negative duration', { duration: -10 }], ['fractional duration', { duration: 5.5 }],
  ['excessive duration', { duration: 241 }], ['unknown type', { type: 'unknown' }],
]) {
  test(`booking rejects ${name}`, () => assert.ok(validateSession({ ...booking, ...patch }, now)));
}
function statusClient(result, calls) {
  const query = {
    update(value) { calls.push(['update', value]); return this; },
    eq(key, value) { calls.push([key, value]); return this; },
    select() { return this; },
    async maybeSingle() { if (result instanceof Error) throw result; return result; },
  };
  return { from(table) { assert.equal(table, 'sessions'); return query; } };
}
test('completion is scoped to the specialist and an in-progress session', async () => {
  const calls = [];
  const result = await saveSessionStatus(statusClient({ data: { id: 's', status: 'completed' } }, calls), { sessionId: 's', specialistId: 'doctor', status: 'completed' });
  assert.equal(result.error, null);
  assert.deepEqual(calls, [['update', { status: 'completed' }], ['id', 's'], ['specialist_id', 'doctor'], ['status', 'in_progress']]);
});
for (const response of [{ data: null }, { error: { message: 'denied' } }, new Error('offline')]) {
  test('unconfirmed session transition reports failure', async () => {
    assert.ok((await saveSessionStatus(statusClient(response, []), { sessionId: 's', specialistId: 'doctor', status: 'in_progress' })).error);
  });
}
test('missing specialist sends no request', async () => {
  const calls = [];
  assert.ok((await saveSessionStatus(statusClient({}, calls), { sessionId: 's', status: 'completed' })).error);
  assert.deepEqual(calls, []);
});
