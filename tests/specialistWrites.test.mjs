import test from 'node:test';
import assert from 'node:assert/strict';
import { saveSpecialistRecord } from '../src/services/specialistWrites.js';

for (const table of ['sessions', 'reports']) {
  test(`${table}: successful save is reported`, async () => {
    const client = { from(name) { assert.equal(name, table); return { insert: async () => ({ error: null }) }; } };
    assert.deepEqual(await saveSpecialistRecord(client, table, {}), { error: null });
  });
  test(`${table}: permission failures do not expose database details`, async () => {
    const client = { from: () => ({ insert: async () => ({ error: { message: 'private_database_details' } }) }) };
    const result = await saveSpecialistRecord(client, table, {});
    assert.ok(result.error);
    assert.doesNotMatch(result.error, /private_database_details/);
  });
  test(`${table}: interrupted save is not retried or reported as success`, async () => {
    let writes = 0;
    const client = { from: () => ({ insert: async () => { writes++; throw new Error('offline'); } }) };
    const result = await saveSpecialistRecord(client, table, {});
    assert.match(result.error, /تحقق من القائمة/);
    assert.equal(writes, 1);
  });
}
