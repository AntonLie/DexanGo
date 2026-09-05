// Attendance days are bucketed by company time (Asia/Jakarta), regardless of
// the server host's own timezone or an env var being set correctly, and
// regardless of which timezone an employee is physically WFH-ing from.
const ATTENDANCE_TZ = 'Asia/Jakarta';

const ymdFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: ATTENDANCE_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function ymd(d: Date): string {
  return ymdFormatter.format(d);
}

export function todayYmd(): string {
  return ymd(new Date());
}

export function startOfMonthYmd(): string {
  return `${todayYmd().slice(0, 7)}-01`;
}

export function isYmd(s: string | undefined): s is string {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
}
