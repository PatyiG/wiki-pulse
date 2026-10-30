import assert from 'node:assert/strict';
import { test } from 'node:test';
import { advanceWindow, createStreamStore, SECONDS_TRACKED } from '../../src/store/store.ts';
import type { EditEvent } from '../../src/stream/types.ts';

let n = 0;
function ev(partial: Partial<EditEvent> = {}): EditEvent {
  n += 1;
  return {
    id: `e${n}`, wiki: 'enwiki', server: 'en.wikipedia.org', title: `Page ${n}`, url: '', user: 'u',
    bot: false, type: 'edit', sizeDelta: 1, time: 0, comment: '', ...partial,
  };
}

test('batches pushes and notifies once per flush', () => {
  const store = createStreamStore({ now: () => 1_000_000 });
  let notified = 0;
  store.subscribe(() => notified++);
  store.push(ev());
  store.push(ev());
  assert.equal(store.getState().events.length, 0, 'nothing is visible before the flush');
  store.flush(1_000_000);
  assert.equal(notified, 1);
  assert.equal(store.getState().events.length, 2);
  assert.equal(store.getState().total, 2);
});

test('shows newest first and caps the buffer', () => {
  const store = createStreamStore({ maxEvents: 3, now: () => 0 });
  const pushed = [ev(), ev(), ev(), ev(), ev()];
  pushed.forEach((e) => store.push(e));
  store.flush(0);
  assert.deepEqual(store.getState().events.map((e) => e.id), [pushed[4].id, pushed[3].id, pushed[2].id]);
  assert.equal(store.getState().total, 5, 'stats count everything, even what was trimmed');
});

test('a flush with nothing new and the same second does not notify', () => {
  const store = createStreamStore({ now: () => 5_000 });
  let notified = 0;
  store.subscribe(() => notified++);
  store.flush(5_000);
  assert.equal(notified, 0);
});

test('counts per type and per wiki', () => {
  const store = createStreamStore({ now: () => 0 });
  store.push(ev({ type: 'new', wiki: 'huwiki' }));
  store.push(ev({ type: 'edit', wiki: 'huwiki' }));
  store.push(ev({ type: 'log', wiki: 'dewiki' }));
  store.flush(0);
  const s = store.getState();
  assert.deepEqual(s.byType, { edit: 1, new: 1, log: 1, categorize: 0 });
  assert.deepEqual(s.byWiki, { huwiki: 2, dewiki: 1 });
});

test('pausing freezes the table and resuming merges what arrived', () => {
  const store = createStreamStore({ now: () => 0 });
  store.push(ev());
  store.flush(0);
  store.setPaused(true);
  const frozen = store.getState().events;
  store.push(ev());
  store.push(ev());
  store.flush(0);
  assert.equal(store.getState().events, frozen, 'same array identity while paused');
  assert.equal(store.getState().pending.length, 2);
  assert.equal(store.getState().total, 3, 'stats keep counting while paused');
  store.setPaused(false);
  assert.equal(store.getState().events.length, 3);
  assert.equal(store.getState().pending.length, 0);
});

test('the per-second window slides and drops old buckets', () => {
  assert.deepEqual(advanceWindow([1, 2, 3], 10, 11), [2, 3, 0]);
  assert.deepEqual(advanceWindow([1, 2, 3], 10, 10), [1, 2, 3]);
  assert.deepEqual(advanceWindow([1, 2, 3], 10, 50), [0, 0, 0]);

  const store = createStreamStore({ now: () => 0 });
  store.push(ev());
  store.flush(0);
  store.push(ev());
  store.push(ev());
  store.flush(2_000);
  const ps = store.getState().perSecond;
  assert.equal(ps.length, SECONDS_TRACKED);
  assert.deepEqual(ps.slice(-3), [1, 0, 2]);
});
