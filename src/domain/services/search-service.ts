import { SearchFiltersSchema, type ListingSummary, type SearchFilters } from '../models.js';
import { CapabilityRouter } from '../../transports/router/capability-router.js';

export class SearchService {
  constructor(private readonly router: CapabilityRouter) {}

  async search(
    query: string,
    filters: SearchFilters = {},
  ): Promise<{ items: ListingSummary[]; transportUsed: string; fallbackReason?: string }> {
    const parsed = SearchFiltersSchema.parse(filters);
    const result = await this.router.search(query, parsed);
    const items = result.value.map((item) => ({
      ...item,
      transportUsed: result.transportUsed,
      fallbackReason: result.fallbackReason,
    }));
    return { items, transportUsed: result.transportUsed, fallbackReason: result.fallbackReason };
  }
}
