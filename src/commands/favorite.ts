import type { Command } from 'commander';
import { printListings } from '../output/formatters.js';
import { printJson } from '../output/json.js';
import { createAppContext } from '../runtime/create-app-context.js';

export function registerFavorite(program: Command): void {
  const favorite = program.command('favorite').description('Manage favorite listings');

  favorite.command('list').description('List favorite listings').action(async function () {
    const ctx = createAppContext(this.parent?.parent?.opts());
    const result = await ctx.favoriteService.list();
    if (this.parent?.parent?.opts().json) printJson(result);
    else printListings(result.items);
  });

  favorite.command('add <listingId>').description('Favorite a listing').action(async function (listingId: string) {
    const ctx = createAppContext(this.parent?.parent?.opts());
    const result = await ctx.favoriteService.add(listingId);
    if (this.parent?.parent?.opts().json) printJson(result);
    else printListings([result.item]);
  });

  favorite.command('remove <listingId>').description('Remove a listing from favorites').action(async function (listingId: string) {
    const ctx = createAppContext(this.parent?.parent?.opts());
    const result = await ctx.favoriteService.remove(listingId);
    if (this.parent?.parent?.opts().json) printJson(result);
    else printListings([result.item]);
  });
}
