import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULT_FILTERS, filtersFromSearch, filtersToSearch, matches } from '../../src/filters/filters.ts';
import type { EditEvent } from '../../src/stream/types.ts';

const base: EditEvent = {
  id: '1', wiki: 'huwiki', server: 'hu.wikipedia.org', title: 'Budapest', url: '', user: 'Példa',
  bot: false, type: 'edit', sizeDelta: 10, time: 0, comment: '',
};

test('default filters hide bots and keep everything else', () => {
  assert.equal(matches(base, DEFAULT_FILTERS), true);
  assert.equal(matches({ ...base, bot: true }, DEFAULT_FILTERS), false);
});

test('filters by wiki, type, bots and search text', () => {
  assert.equal(matches(base, { ...DEFAULT_FILTERS, wiki: 'enwiki' }), false);
  assert.equal(matches(base, { ...DEFAULT_FILTERS, type: 'new' }), false);
  assert.equal(matches({ ...base, bot: true }, { ...DEFAULT_FILTERS, bots: 'only' }), true);
  assert.equal(matches(base, { ...DEFAULT_FILTERS, bots: 'only' }), false);
  assert.equal(matches(base, { ...DEFAULT_FILTERS, q: 'buda' }), true, 'title, case-insensitive');
  assert.equal(matches(base, { ...DEFAULT_FILTERS, q: 'PÉLDA' }), true, 'user name');
  assert.equal(matches(base, { ...DEFAULT_FILTERS, q: 'debrecen' }), false);
});

test('round-trips through the query string and omits defaults', () => {
  assert.equal(filtersToSearch(DEFAULT_FILTERS), '');
  const f = { wiki: 'huwiki', type: 'new' as const, bots: 'include' as const, q: 'vár' };
  assert.deepEqual(filtersFromSearch(filtersToSearch(f)), f);
});

test('ignores unknown values in the URL', () => {
  assert.deepEqual(filtersFromSearch('?type=bogus&bots=maybe'), DEFAULT_FILTERS);
});
