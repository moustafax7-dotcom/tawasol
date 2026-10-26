import test from 'node:test';
import assert from 'node:assert/strict';
import { verifySessionAccount, signOutCurrentDevice } from '../src/services/sessionAccount.js';

test('verified account exposes only identity fields', async () => {
  const client = { auth: { getUser: async () => ({ data: { user: { id: 'qa', email: 'qa@example.com', extra: 'excluded' } } }) } };
  assert.deepEqual(await verifySessionAccount(client, 'qa'), { id: 'qa', email: 'qa@example.com' });
});

test('a changed account is never attributed to the previous user', async () => {
  const client = { auth: { getUser: async () => ({ data: { user: { id: 'owner' } } }) } };
  assert.equal(await verifySessionAccount(client, 'qa'), null);
});

test('identity verification fails closed on auth errors or connection failure', async () => {
  assert.equal(await verifySessionAccount({ auth: { getUser: async () => ({ error: { message: 'denied' } }) } }, 'qa'), null);
  assert.equal(await verifySessionAccount({ auth: { getUser: async () => { throw Error('offline'); } } }, 'qa'), null);
});

test('logout targets this device only and propagates failure', async () => {
  let options;
  await signOutCurrentDevice({ auth: { signOut: async value => { options = value; return {}; } } });
  assert.deepEqual(options, { scope: 'local' });
  await assert.rejects(signOutCurrentDevice({ auth: { signOut: async () => ({ error: Error('offline') }) } }));
});
