import type { Command } from 'commander';
import { printListings } from '../output/formatters.js';
import { printJson } from '../output/json.js';
import { createAppContext } from '../runtime/create-app-context.js';

export function registerItem(program: Command): void {
  const item = program.command('item').description('Inspect one or more Bunjang listings');

  item
    .command('get <listingId>')
    .description('Fetch a normalized listing detail document')
    .action(async function (listingId: string) {
      const ctx = createAppContext(this.parent?.parent?.opts());
      const result = await ctx.itemService.get(listingId);
      if (this.parent?.parent?.opts().json) printJson(result);
      else printListings([result.item]);
    });

  item
    .command('list')
    .description('Fetch multiple listing detail documents by id')
    .requiredOption('--ids <ids>', 'comma-separated listing IDs')
    .action(async function (options) {
      const ids = String(options.ids).split(',').map((value) => value.trim()).filter(Boolean);
      const ctx = createAppContext(this.parent?.parent?.opts());
      const result = await ctx.itemService.list(ids);
      if (this.parent?.parent?.opts().json) printJson(result);
      else printListings(result.items);
    });
}
