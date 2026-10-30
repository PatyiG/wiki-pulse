/** The subset of a Wikimedia `recentchange` event that the dashboard uses. */
export type ChangeType = 'edit' | 'new' | 'log' | 'categorize';

export interface EditEvent {
  id: string;
  /** Database name, e.g. `enwiki`, `huwiki`, `wikidatawiki`. */
  wiki: string;
  /** Host name, e.g. `en.wikipedia.org`. */
  server: string;
  title: string;
  url: string;
  user: string;
  bot: boolean;
  type: ChangeType;
  /** Change in page size in bytes; `null` for log entries. */
  sizeDelta: number | null;
  /** Unix time in milliseconds. */
  time: number;
  comment: string;
}

export type ConnectionStatus = 'connecting' | 'open' | 'reconnecting' | 'closed';
