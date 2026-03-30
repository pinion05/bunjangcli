import type { Command } from 'commander';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { printListings } from '../output/formatters.js';
import { printJson } from '../output/json.js';
import { createAppContext } from '../runtime/create-app-context.js';

export function registerSearch(program: Command): void {
  program
    .command('search <query>')
    .description('Search Bunjang listings with optional price filters')
    .option('--price-min <krw>', 'minimum price in KRW', Number)
    .option('--price-max <krw>', 'maximum price in KRW', Number)
    .option('--max-items <count>', 'max number of items to collect', Number, 20)
    .option('--start-page <number>', 'start page number', Number, 1)
    .option('--pages <count>', 'how many pages to crawl from the start page', Number, 1)
    .option('--sort <order>', 'score | date | price_asc | price_desc', 'score')
    .option('--with-detail', 'fetch full item content for every collected listing')
    .option('--output <path>', 'write collected results to a file')
    .option('--concurrency <count>', 'detail fetch concurrency when --with-detail is enabled', Number, 5)
    .action(async function (query: string, options) {
      const ctx = createAppContext(this.parent?.opts());
      const filters = {
        priceMin: options.priceMin,
        priceMax: options.priceMax,
        maxItems: options.maxItems,
        startPage: options.startPage,
        pages: options.pages,
        sort: options.sort,
      } as const;

      if (options.withDetail || options.output) {
        const result = await ctx.searchExportService.collect(query, filters, {
          withDetail: Boolean(options.withDetail),
          concurrency: options.concurrency,
        });
        if (options.output) {
          const outputPath = resolve(options.output);
          mkdirSync(dirname(outputPath), { recursive: true });
          writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
        }
        if (this.parent?.opts().json || options.output) {
          printJson({
            query: result.query,
            collectedAt: result.collectedAt,
            count: result.items.length,
            output: options.output ? resolve(options.output) : null,
            withDetail: Boolean(options.withDetail),
          });
        } else {
          printListings(result.items.map((item) => item.detail ?? item.summary));
        }
        return;
      }

      const result = await ctx.searchService.search(query, filters);
      if (this.parent?.opts().json) {
        printJson(result);
      } else {
        printListings(result.items);
      }
    });
}
