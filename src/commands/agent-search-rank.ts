import type { Command } from 'commander';
import { printJson } from '../output/json.js';
import { printRankedListings } from '../output/formatters.js';
import { createAppContext } from '../runtime/create-app-context.js';

export function registerAgentSearchRank(program: Command): void {
  program.command('agent-search-rank <query>')
    .description('Search, inspect, and rank candidate listings with optional price filters')
    .option('--price-min <krw>', 'minimum price in KRW', Number)
    .option('--price-max <krw>', 'maximum price in KRW', Number)
    .option('--max-items <count>', 'number of candidates to collect/evaluate', Number, 10)
    .option('--start-page <number>', 'start page number', Number, 1)
    .option('--pages <count>', 'how many pages to crawl from the start page', Number, 1)
    .option('--sort <order>', 'score | date | price_asc | price_desc', 'score')
    .action(async function (query: string, options) {
      const ctx = createAppContext(this.parent?.opts());
      const result = await ctx.agentSearchRankService.run(query, {
        priceMin: options.priceMin,
        priceMax: options.priceMax,
        maxItems: options.maxItems,
        startPage: options.startPage,
        pages: options.pages,
        sort: options.sort,
      });
      if (this.parent?.opts().json) printJson(result);
      else printRankedListings(result.ranked);
    });
}
