import type { ListingDetail, ListingSummary, SearchFilters } from '../models.js';
import { ItemService } from './item-service.js';
import { SearchService } from './search-service.js';

export interface SearchExportItem {
  sourcePage?: number | null;
  summary: ListingSummary;
  detail?: ListingDetail;
  error?: string;
}

export interface SearchExportResult {
  query: string;
  filters: SearchFilters;
  collectedAt: string;
  searchTransport: string;
  itemTransport: string | null;
  items: SearchExportItem[];
}

export class SearchExportService {
  constructor(
    private readonly searchService: SearchService,
    private readonly itemService: ItemService,
  ) {}

  async collect(
    query: string,
    filters: SearchFilters,
    options: { withDetail?: boolean; concurrency?: number } = {},
  ): Promise<SearchExportResult> {
    const { items, transportUsed } = await this.searchService.search(query, filters);
    const result: SearchExportResult = {
      query,
      filters,
      collectedAt: new Date().toISOString(),
      searchTransport: transportUsed,
      itemTransport: null,
      items: items.map((summary) => ({ summary })),
    };

    if (!options.withDetail || items.length === 0) {
      return result;
    }

    const concurrency = Math.max(1, options.concurrency ?? 5);
    let index = 0;
    const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (index < items.length) {
        const current = index;
        index += 1;
        const summary = items[current];
        try {
          const detailResult = await this.itemService.get(summary.id);
          result.itemTransport = detailResult.transportUsed;
      result.items[current] = {
        sourcePage: typeof summary.raw?.page === 'number' ? summary.raw.page : null,
        summary,
        detail: detailResult.item,
      };
        } catch (error) {
          result.items[current] = {
            sourcePage: typeof summary.raw?.page === 'number' ? summary.raw.page : null,
            summary,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }
    });

    await Promise.all(workers);
    return result;
  }
}
