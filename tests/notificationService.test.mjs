import test from 'node:test';
import assert from 'node:assert/strict';
import { persistReadNotifications } from '../src/services/notificationService.js';

function client(result) {
  const calls = [];
  const query = {};
  for (const method of ['from', 'update', 'eq', 'in']) {
    query[method] = (...args) => { calls.push([method, ...args]); return query; };
  }
  query.select = async () => { if (result instanceof Error) throw result; return result; };
  return { query, calls };
}
test('read updates are scoped to the current user and confirmed by database', async () => {
  const { query, calls } = client({ data: [{ id: 'n1' }], error: null });
  assert.deepEqual(await persistReadNotifications(query, 'u1', ['n1']), ['n1']);
  assert.ok(calls.some(call => call[0] === 'eq' && call[1] === 'user_id' && call[2] === 'u1'));
});
test('denied or partial updates never report success', async () => {
  for (const data of [[], null, [{ id: 'n1' }]]) {
    await assert.rejects(persistReadNotifications(client({ data }).query, 'u1', ['n1', 'n2']));
  }
});
test('database and network failures propagate for visible error handling', async () => {
  await assert.rejects(persistReadNotifications(client({ error: new Error('denied') }).query, 'u1', ['n1']));
  await assert.rejects(persistReadNotifications(client(new Error('offline')).query, 'u1', ['n1']));
});
test('missing user and empty selection make no database requests', async () => {
  const { query, calls } = client({});
  assert.deepEqual(await persistReadNotifications(query, null, ['n1']), []);
  assert.deepEqual(await persistReadNotifications(query, 'u1', []), []);
  assert.equal(calls.length, 0);
});
