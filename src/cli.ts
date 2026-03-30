#!/usr/bin/env node
import { Command } from 'commander';
import { registerAgentSearchRank } from './commands/agent-search-rank.js';
import { registerAuth } from './commands/auth.js';
import { registerChat } from './commands/chat.js';
import { registerFavorite } from './commands/favorite.js';
import { registerItem } from './commands/item.js';
import { registerPurchase } from './commands/purchase.js';
import { registerSearch } from './commands/search.js';

const program = new Command();
program
  .name('bunjang-cli')
  .description('CLI-first Bunjang client for humans and AI agents')
  .option('--json', 'emit machine-readable JSON')
  .option('--debug', 'emit transport diagnostics')
  .option('--preferred-transport <transport>', 'auto | browser | api', 'auto');

registerAuth(program);
registerSearch(program);
registerItem(program);
registerChat(program);
registerFavorite(program);
registerPurchase(program);
registerAgentSearchRank(program);

program.parseAsync(process.argv).catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
