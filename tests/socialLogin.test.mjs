import test from 'node:test';
import assert from 'node:assert/strict';
import { callbackNotice, enabledProviders, socialLoginOptions } from '../src/services/socialLogin.js';

test('only enabled supported providers are offered, with Google first', () => {
  assert.deepEqual(enabledProviders({external:{google:true,facebook:true,github:true}}), ['google','facebook']);
  assert.deepEqual(enabledProviders({external:{google:false,facebook:'true'}}), []);
  assert.deepEqual(enabledProviders(null), []);
});

test('both callbacks stay on the app origin and preserve the child destination', () => {
  for (const provider of ['google','facebook']) {
    const config = socialLoginOptions(provider,'https://example.test','/kids');
    assert.equal(config.options.redirectTo,'https://example.test/complete-profile?next=%2Fkids');
    assert.equal(socialLoginOptions(provider,'https://example.test','https://other.test').options.redirectTo,'https://example.test/complete-profile');
  }
  assert.throws(() => socialLoginOptions('unknown','https://example.test'));
});

test('cancelled and failed OAuth returns expose only a fixed notice', () => {
  assert.equal(callbackNotice('?next=/kids', '#error=access_denied'), 'cancelled');
  assert.equal(callbackNotice('?error=server_error&error_description=private', ''), 'failed');
  assert.equal(callbackNotice('?code=example', ''), null);
});
