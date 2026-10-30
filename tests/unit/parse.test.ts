import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseChange } from '../../src/stream/parse.ts';

const edit = {
  meta: { id: 'abc-1', uri: 'https://hu.wikipedia.org/wiki/Budapest', dt: '2026-10-30T07:00:00Z' },
  wiki: 'huwiki',
  server_name: 'hu.wikipedia.org',
  title: 'Budapest',
  title_url: 'https://hu.wikipedia.org/wiki/Budapest',
  user: 'Példa',
  bot: false,
  type: 'edit',
  length: { old: 1000, new: 1042 },
  timestamp: 1793336400,
  comment: 'typo',
};

test('maps a recentchange edit to an EditEvent', () => {
  const e = parseChange(JSON.stringify(edit));
  assert.ok(e);
  assert.equal(e.id, 'abc-1');
  assert.equal(e.wiki, 'huwiki');
  assert.equal(e.sizeDelta, 42);
  assert.equal(e.time, 1793336400 * 1000);
  assert.equal(e.bot, false);
});

test('treats a new page as growth from zero', () => {
  const e = parseChange(JSON.stringify({ ...edit, type: 'new', length: { new: 500 } }));
  assert.equal(e?.sizeDelta, 500);
});

test('log entries have no size delta', () => {
  const e = parseChange(JSON.stringify({ ...edit, type: 'log', length: undefined }));
  assert.equal(e?.sizeDelta, null);
});

test('ignores malformed JSON and unknown types instead of throwing', () => {
  assert.equal(parseChange('{not json'), null);
  assert.equal(parseChange(JSON.stringify({ ...edit, type: 'external' })), null);
  assert.equal(parseChange(JSON.stringify({ ...edit, title: undefined })), null);
  assert.equal(parseChange('null'), null);
});
