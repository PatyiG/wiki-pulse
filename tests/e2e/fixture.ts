/** A fake Wikimedia EventStreams response, so end-to-end tests never hit the network. */
export interface FakeChange {
  wiki: string;
  title: string;
  type: 'edit' | 'new' | 'log';
  bot?: boolean;
  user?: string;
}

export const CHANGES: FakeChange[] = [
  { wiki: 'huwiki', title: 'Budapest', type: 'edit', user: 'Anna' },
  { wiki: 'huwiki', title: 'Debrecen', type: 'new', user: 'Bence' },
  { wiki: 'enwiki', title: 'Danube', type: 'edit', user: 'Carol' },
  { wiki: 'enwiki', title: 'Lake Balaton', type: 'edit', user: 'Dave' },
  { wiki: 'dewiki', title: 'Donau', type: 'log', user: 'Eva' },
  { wiki: 'enwiki', title: 'Hungary', type: 'edit', bot: true, user: 'TidyBot' },
  { wiki: 'wikidatawiki', title: 'Q1781', type: 'edit', bot: true, user: 'DataBot' },
  { wiki: 'enwiki', title: 'Rubik’s Cube', type: 'new', user: 'Frank' },
];

export function sseBody(changes: FakeChange[] = CHANGES): string {
  const now = Math.floor(Date.now() / 1000);
  return changes
    .map((c, i) => {
      const data = {
        meta: { id: `fixture-${i}`, uri: `https://example.org/${i}` },
        wiki: c.wiki,
        server_name: `${c.wiki.replace('wiki', '')}.wikipedia.org`,
        title: c.title,
        title_url: `https://${c.wiki.replace('wiki', '')}.wikipedia.org/wiki/${encodeURIComponent(c.title)}`,
        user: c.user ?? 'someone',
        bot: c.bot ?? false,
        type: c.type,
        length: c.type === 'log' ? undefined : { old: 100, new: 100 + (i + 1) * 10 },
        timestamp: now,
        comment: '',
      };
      return `event: message\nid: ${i}\ndata: ${JSON.stringify(data)}\n\n`;
    })
    .join('');
}
