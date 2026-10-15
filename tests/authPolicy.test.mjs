import test from 'node:test';
import assert from 'node:assert/strict';
import { getAuthDestination, getAuthErrorMessage, normalizeAuthError } from '../src/services/authPolicy.js';

test('specialist cannot inherit a parent redirect', () => {
  assert.equal(getAuthDestination('specialist', '/parent'), '/tawasl');
  assert.equal(getAuthDestination('parent', '/tawasl'), '/parent');
  assert.equal(getAuthDestination('parent', '/kids'), '/kids');
});
test('unknown roles have a recovery route, never a dashboard', () => {
  for (const role of [null, undefined, '', 'admin']) assert.equal(getAuthDestination(role), '/complete-profile');
  assert.equal(getAuthDestination('parent', 'https://example.com'), '/parent');
});
test('email confirmation errors retain actionable Arabic feedback', () => {
  const error = normalizeAuthError({ code: 'email_not_confirmed', message: 'Email not confirmed' });
  assert.equal(error.code, 'email_not_confirmed');
  assert.match(getAuthErrorMessage(error.code), /تأكيد/);
  assert.equal(normalizeAuthError({ message: 'Invalid login credentials' }).code, 'invalid_credentials');
  assert.equal(normalizeAuthError({ message: 'Email not confirmed' }).code, 'email_not_confirmed');
});
