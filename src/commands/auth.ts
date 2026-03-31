import type { Command } from 'commander';
import { printSessionStatus } from '../output/formatters.js';
import { printJson } from '../output/json.js';
import { createAppContext } from '../runtime/create-app-context.js';

export function registerAuth(program: Command): void {
  const auth = program.command('auth').description('Authenticate and inspect CLI session status');

  auth
    .command('login')
    .description('Open a headful browser and let the user log in')
    .action(async function () {
      const ctx = createAppContext(this.parent?.parent?.opts());
      const result = await ctx.sessionService.login();
      if (this.parent?.parent?.opts().json) printJson(result);
      else printSessionStatus(result.status);
    });

  auth
    .command('status')
    .description('Show current authentication/session status')
    .action(async function () {
      const ctx = createAppContext(this.parent?.parent?.opts());
      const result = await ctx.sessionService.status();
      if (this.parent?.parent?.opts().json) printJson(result);
      else printSessionStatus(result.status);
    });

  auth
    .command('logout')
    .description('Clear the local CLI session/profile so the next auth flow starts logged out')
    .action(async function () {
      const ctx = createAppContext(this.parent?.parent?.opts());
      const result = await ctx.sessionService.logout();
      if (this.parent?.parent?.opts().json) printJson(result);
      else printSessionStatus(result.status);
    });
}
