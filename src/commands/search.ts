import type { Command } from 'commander';
import { printListings } from '../output/formatters.js';
import { printJson } from '../output/json.js';
import { resolveAiOutputDir, writeSearchExport } from '../output/search-export-writer.js';
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
    .option('--ai', 'write AI-oriented TOON chunks instead of a single JSON export')
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

      assertAiRequirements(options);

      if (options.ai || options.withDetail || options.output) {
        const result = await ctx.searchExportService.collect(query, filters, {
          withDetail: Boolean(options.withDetail),
          concurrency: options.concurrency,
        });

        if (options.output) {
          const writeResult = writeSearchExport(result, {
            outputPath: options.output,
            ai: Boolean(options.ai),
          });
          printJson({
            query: result.query,
            collectedAt: result.collectedAt,
            count: writeResult.count,
            output: writeResult.output,
            withDetail: Boolean(options.withDetail),
            ai: writeResult.mode === 'ai',
            fileCount: writeResult.files.length,
            files: writeResult.files,
          });
          return;
        }

        if (this.parent?.opts().json) {
          printJson({
            query: result.query,
            collectedAt: result.collectedAt,
            count: result.items.length,
            output: null,
            withDetail: Boolean(options.withDetail),
            ai: false,
          });
          return;
        }

        printListings(result.items.map((item) => item.detail ?? item.summary));
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

export function assertAiRequirements(options: { ai?: boolean; output?: string | null | undefined }): void {
  if (options.ai && !options.output) {
    throw new Error('AI export requires --output to point to an explicit destination directory.');
  }
  if (options.ai && options.output) {
    resolveAiOutputDir(options.output);
  }
}
