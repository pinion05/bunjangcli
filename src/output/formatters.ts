import type { ChatThread, ListingDetail, ListingSummary, PurchaseState, RankedListing, SessionStatus } from '../domain/models.js';
import { truncate } from '../utils/text.js';

export function printSessionStatus(status: SessionStatus): void {
  console.table([
    {
      authenticated: status.authenticated,
      profileExists: status.profileExists,
      headfulLoginRequired: status.headfulLoginRequired,
      lastLoginAt: status.lastLoginAt,
      userDataDir: status.userDataDir,
    },
  ]);
}

export function printListings(items: Array<ListingSummary | ListingDetail>): void {
  console.table(items.map((item) => ({
    id: item.id,
    title: truncate(item.title, 60),
    price: item.price ?? 'n/a',
    url: truncate(item.url, 60),
    transport: item.transportUsed ?? 'unknown',
  })));
}

export function printChatThreads(threads: ChatThread[]): void {
  console.table(threads.map((thread) => ({
    id: thread.id,
    title: truncate(thread.title, 60),
    lastMessage: truncate(thread.lastMessage ?? '', 40),
    unreadCount: thread.unreadCount ?? 0,
    url: truncate(thread.url ?? '', 60),
  })));
}

export function printChatDetail(thread: { title: string; messages: Array<{ sender?: string | null; body: string; timestamp?: string | null }> }): void {
  console.log(`# ${thread.title}`);
  for (const message of thread.messages) {
    console.log(`- ${message.sender ?? 'unknown'}: ${message.body}`);
  }
}

export function printPurchaseState(state: PurchaseState): void {
  console.table([state]);
}

export function printRankedListings(ranked: RankedListing[]): void {
  console.table(ranked.map((entry) => ({
    id: entry.listing.id,
    title: truncate(entry.listing.title, 50),
    price: entry.listing.price ?? 'n/a',
    score: entry.score,
    reasons: truncate(entry.reasons.join('; '), 80),
  })));
}
