import test from 'node:test';
import assert from 'node:assert/strict';
import { loadOperations } from '../src/services/operations.js';
const counts = { families: 0, specialists: 2, children: 3, sessions: 4, scheduled: 2, completed: 1, cancelled: 1 };
test('loads only the authorized aggregate RPC and preserves real zero counts', async () => {
  const result = await loadOperations({ rpc: async name => { assert.equal(name, 'operations_overview'); return { data: counts }; } });
  assert.deepEqual(result, { status: 'ready', data: counts });
});
for (const [code, status] of [['42501', 'denied'], ['PGRST202', 'unavailable'], ['XX000', 'error']]) {
  test(`handles ${code} without exposing database details`, async () => {
    assert.deepEqual(await loadOperations({ rpc: async () => ({ error: { code, message: 'private details' } }) }), { status });
  });
}
for (const data of [null, {}, { ...counts, families: -1 }, { ...counts, children: '3' }, { ...counts, sessions: 1.5 }]) {
  test(`rejects incomplete or invalid aggregate ${JSON.stringify(data)}`, async () => {
    assert.deepEqual(await loadOperations({ rpc: async () => ({ data }) }), { status: 'error' });
  });
}
test('handles connection rejection', async () => {
  assert.deepEqual(await loadOperations({ rpc: async () => { throw new Error('network'); } }), { status: 'error' });
});
