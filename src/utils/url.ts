export function listingUrl(id: string): string {
  return `https://mercari.bunjang.co.kr/products/${encodeURIComponent(id)}`;
}

export function listingActionUrl(id: string): string {
  return `https://m.bunjang.co.kr/products/${encodeURIComponent(id)}`;
}

export function searchUrl(query: string): string {
  return searchPageUrl(query, 1, 'score');
}

export function searchPageUrl(query: string, page: number, order: 'score' | 'date' | 'price_asc' | 'price_desc' = 'score'): string {
  const url = new URL('https://m.bunjang.co.kr/search/products');
  url.searchParams.set('order', order);
  url.searchParams.set('page', String(page));
  url.searchParams.set('q', query);
  return url.toString();
}
