import type { Command } from 'commander';
import { printPurchaseState } from '../output/formatters.js';
import { printJson } from '../output/json.js';
import { createAppContext } from '../runtime/create-app-context.js';

export function registerPurchase(program: Command): void {
  const purchase = program.command('purchase').description('Inspect and start purchase-related workflows without auto-confirmation');

  purchase.command('prepare <listingId>').description('Inspect purchase availability').action(async function (listingId: string) {
    const ctx = createAppContext(this.parent?.parent?.opts());
    const result = await ctx.purchaseService.prepare(listingId);
    if (this.parent?.parent?.opts().json) printJson(result);
    else printPurchaseState(result.state);
  });

  purchase.command('start <listingId>').description('Open purchase flow and stop before final confirmation').action(async function (listingId: string) {
    const ctx = createAppContext(this.parent?.parent?.opts());
    const result = await ctx.purchaseService.start(listingId);
    if (this.parent?.parent?.opts().json) printJson(result);
    else printPurchaseState(result.state);
  });
}
