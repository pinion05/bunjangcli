import { describe, expect, it } from 'vitest';
import { ListingDetailSchema, SearchFiltersSchema } from '../../src/domain/models.js';

describe('domain models', () => {
  it('validates search filters', () => {
    const parsed = SearchFiltersSchema.parse({ priceMin: 1000, priceMax: 2000, maxItems: 10 });
    expect(parsed.maxItems).toBe(10);
  });

  it('validates normalized listing detail objects', () => {
    const parsed = ListingDetailSchema.parse({
      id: '1',
      title: 'Item',
      url: 'https://m.bunjang.co.kr/products/1',
      price: 1000,
      currency: 'KRW',
      description: 'Good condition',
      metadata: {},
    });
    expect(parsed.title).toBe('Item');
  });
});
