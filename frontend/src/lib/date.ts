// src/lib/date.ts
export function getToday(): string {
  return new Date().toISOString().split('T')[0]!;
}

export function subtractDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0]!;
}

export function daysBetween(a: string, b: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay);
}

export function dateRangeFromDays(days: number): { from: string; to: string } {
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days + 1);
  return {
    to: toDate.toISOString().split('T')[0]!,
    from: fromDate.toISOString().split('T')[0]!,
  };
}
