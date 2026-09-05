import type { SortDir } from '@dexago/shared';

export const DEFAULT_DIR: SortDir = 'desc';

export function parseDir(raw: string | null, fallback: SortDir = DEFAULT_DIR): SortDir {
  return raw === 'asc' || raw === 'desc' ? raw : fallback;
}

export function makeSortParser<T extends string>(fields: readonly T[], fallback: T) {
  return (raw: string | null): T => (fields.includes(raw as T) ? (raw as T) : fallback);
}
