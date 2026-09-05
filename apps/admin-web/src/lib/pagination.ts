export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export const DEFAULT_LIMIT = 10;

export const pageSizeSelectData = PAGE_SIZE_OPTIONS.map((n) => ({
  value: String(n),
  label: `${n} / page`,
}));

export function parseLimit(raw: string | null, fallback = DEFAULT_LIMIT): number {
  const n = Number(raw);
  return PAGE_SIZE_OPTIONS.includes(n as (typeof PAGE_SIZE_OPTIONS)[number]) ? n : fallback;
}

export function parsePage(raw: string | null): number {
  const n = Math.trunc(Number(raw));
  return Number.isFinite(n) && n >= 1 ? n : 1;
}
