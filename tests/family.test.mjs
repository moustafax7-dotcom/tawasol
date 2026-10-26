import test from 'node:test';
import assert from 'node:assert/strict';
import { addFamilyChild, loadChildAppointments } from '../src/services/family.js';

function database(responses) {
  const calls = [];
  return { calls, from(table) {
    calls.push(['from', table]);
    const response = responses.shift();
    const query = {};
    for (const method of ['select', 'insert', 'eq', 'order', 'range']) {
      query[method] = (...args) => { calls.push([method, ...args]); return query; };
    }
    query.single = query.maybeSingle = async () => response;
    query.then = (resolve, reject) => Promise.resolve(response).then(resolve, reject);
    return query;
  } };
}

test('adding a child scopes the insert to the parent and confirms the row', async () => {
  const db = database([{ data: { id: 'child-1', parent_id: 'parent-1', full_name: 'طفل تجريبي', age: 7 } }]);
  const result = await addFamilyChild(db, 'parent-1', { fullName: ' طفل تجريبي ', age: 7 });
  assert.equal(result.error, null);
  assert.deepEqual(db.calls.find(call => call[0] === 'insert')[1], { parent_id: 'parent-1', full_name: 'طفل تجريبي', age: 7 });
});

test('invalid child data makes no database requests', async () => {
  for (const values of [{ fullName: '', age: 7 }, { fullName: 'طفل', age: -1 }, { fullName: 'طفل', age: 1.5 }, { fullName: 'x'.repeat(121), age: 7 }]) {
    const db = database([]);
    assert.ok((await addFamilyChild(db, 'parent-1', values)).error);
    assert.equal(db.calls.length, 0);
  }
});

test('missing parent and mismatched saved owner never report success', async () => {
  assert.ok((await addFamilyChild(database([]), null, { fullName: 'طفل', age: 7 })).error);
  assert.ok((await addFamilyChild(database([{ data: { id: 'child-1', parent_id: 'other' } }]), 'parent-1', { fullName: 'طفل', age: 7 })).error);
});

test('uncertain child writes are not retried automatically', async () => {
  let count = 0;
  const db = { from() { count++; throw Error('offline'); } };
  assert.match((await addFamilyChild(db, 'parent-1', { fullName: 'طفل', age: 7 })).error, /تجنب التكرار/);
  assert.equal(count, 1);
});

test('unowned child never triggers a sessions query', async () => {
  const db = database([{ data: null }]);
  assert.equal((await loadChildAppointments(db, { parentId: 'parent-1', childId: 'child-1' })).status, 'denied');
  assert.deepEqual(db.calls.filter(call => call[0] === 'from'), [['from', 'children']]);
  assert.ok(db.calls.some(call => call[0] === 'eq' && call[1] === 'parent_id' && call[2] === 'parent-1'));
});

test('appointment paging requests bounded rows without private notes', async () => {
  const rows = Array.from({ length: 21 }, (_, i) => ({ id: `${i}`, child_id: 'child-1' }));
  const db = database([{ data: { id: 'child-1' } }, { data: rows }]);
  const result = await loadChildAppointments(db, { parentId: 'parent-1', childId: 'child-1', page: 2 });
  assert.equal(result.rows.length, 20);
  assert.equal(result.hasMore, true);
  assert.deepEqual(db.calls.find(call => call[0] === 'range'), ['range', 40, 60]);
  assert.equal(db.calls.filter(call => call[0] === 'select').some(call => /notes|\*/.test(call[1])), false);
});

test('empty authorized appointments are distinct from errors', async () => {
  const options = { parentId: 'parent-1', childId: 'child-1' };
  const empty = await loadChildAppointments(database([{ data: { id: 'child-1' } }, { data: [] }]), options);
  assert.deepEqual(empty, { status: 'ready', rows: [], hasMore: false });
  assert.equal((await loadChildAppointments(database([{ data: { id: 'child-1' } }, { error: { message: 'private detail' } }]), options)).status, 'error');
});

test('cross-child responses and network failures do not expose rows', async () => {
  const options = { parentId: 'parent-1', childId: 'child-1' };
  assert.deepEqual(await loadChildAppointments(database([{ data: { id: 'child-1' } }, { data: [{ child_id: 'other' }] }]), options), { status: 'error' });
  assert.deepEqual(await loadChildAppointments({ from() { throw Error('offline'); } }, options), { status: 'error' });
});

test('invalid appointment requests never hit the database', async () => {
  const db = database([]);
  for (const options of [{}, { parentId: 'p', childId: 'c', page: -1 }, { parentId: 'p', childId: 'c', page: 1.5 }]) {
    assert.equal((await loadChildAppointments(db, options)).status, 'error');
  }
  assert.equal(db.calls.length, 0);
});
