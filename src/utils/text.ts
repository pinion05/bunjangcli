export function parsePrice(value: string | null | undefined): number | null {
  if (!value) return null;
  const digits = value.replace(/[^0-9]/g, '');
  return digits ? Number(digits) : null;
}

export function truncate(value: string, max = 80): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

export function scoreKeywordOverlap(query: string, title: string, description?: string | null): number {
  const keywords = query.toLowerCase().split(/\s+/).filter(Boolean);
  const haystack = `${title} ${description ?? ''}`.toLowerCase();
  return keywords.reduce((sum, keyword) => sum + (haystack.includes(keyword) ? 1 : 0), 0);
}
