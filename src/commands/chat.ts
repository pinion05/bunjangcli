import type { Command } from 'commander';
import { printChatDetail, printChatThreads } from '../output/formatters.js';
import { printJson } from '../output/json.js';
import { createAppContext } from '../runtime/create-app-context.js';

export function registerChat(program: Command): void {
  const chat = program.command('chat').description('List, read, and send Bunjang chat threads');

  chat.command('list').description('List chat threads').action(async function () {
    const ctx = createAppContext(this.parent?.parent?.opts());
    const result = await ctx.chatService.list();
    if (this.parent?.parent?.opts().json) printJson(result);
    else printChatThreads(result.threads);
  });

  chat.command('start <listingId>').description('Start a seller chat from a product page and optionally send the first message')
    .requiredOption('--message <text>', 'first message to send')
    .action(async function (listingId: string, options) {
      const ctx = createAppContext(this.parent?.parent?.opts());
      const result = await ctx.chatService.start(listingId, options.message);
      if (this.parent?.parent?.opts().json) printJson(result);
      else printChatDetail(result.thread);
    });

  chat.command('read <threadId>').description('Read a chat thread').action(async function (threadId: string) {
    const ctx = createAppContext(this.parent?.parent?.opts());
    const result = await ctx.chatService.read(threadId);
    if (this.parent?.parent?.opts().json) printJson(result);
    else printChatDetail(result.thread);
  });

  chat.command('send <threadId>').description('Send a message to a chat thread')
    .requiredOption('--message <text>', 'message body')
    .action(async function (threadId: string, options) {
      const ctx = createAppContext(this.parent?.parent?.opts());
      const result = await ctx.chatService.send(threadId, options.message);
      if (this.parent?.parent?.opts().json) printJson(result);
      else printChatDetail(result.thread);
    });
}
