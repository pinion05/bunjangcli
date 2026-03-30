import type { RankedListing, SearchFilters, SearchRankResult } from '../models.js';
import { ItemService } from './item-service.js';
import { SearchService } from './search-service.js';
import { parsePrice, scoreKeywordOverlap } from '../../utils/text.js';

export class AgentSearchRankService {
  constructor(
    private readonly searchService: SearchService,
    private readonly itemService: ItemService,
  ) {}

  async run(query: string, filters: SearchFilters = {}): Promise<SearchRankResult> {
    const maxItems = filters.maxItems ?? 10;
    const { items } = await this.searchService.search(query, { ...filters, maxItems });
    const detailed = await Promise.all(items.slice(0, maxItems).map(async (item) => {
      try {
        const { item: detail } = await this.itemService.get(item.id);
        return detail;
      } catch {
        return {
          ...item,
          description: item.raw?.text ? String(item.raw.text) : null,
          metadata: {},
        };
      }
    }));

    const ranked = detailed
      .map((listing) => this.scoreListing(query, listing))
      .sort((a, b) => b.score - a.score);

    return {
      query,
      evaluatedCount: ranked.length,
      ranked,
    };
  }

  private scoreListing(query: string, listing: any): RankedListing {
    const reasons: string[] = [];
    let score = 0;
    const keywordScore = scoreKeywordOverlap(query, listing.title, listing.description) * 20;
    if (keywordScore > 0) reasons.push(`keyword overlap score ${keywordScore}`);
    score += keywordScore;

    const price = typeof listing.price === 'number' ? listing.price : parsePrice(String(listing.raw?.text ?? ''));
    if (typeof price === 'number') {
      const priceScore = Math.max(0, 30 - Math.log10(Math.max(price, 1)) * 5);
      score += priceScore;
      reasons.push(`price heuristic score ${priceScore.toFixed(1)}`);
    }

    const descriptionLength = listing.description?.length ?? 0;
    if (descriptionLength > 0) {
      const descScore = Math.min(20, descriptionLength / 40);
      score += descScore;
      reasons.push(`description richness score ${descScore.toFixed(1)}`);
    }

    if (listing.imageUrl) {
      score += 5;
      reasons.push('has product image');
    }

    if (reasons.length === 0) reasons.push('baseline ranking from available metadata');
    return {
      listing,
      score: Number(score.toFixed(2)),
      reasons,
    };
  }
}
