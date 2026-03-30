import { describe, expect, it } from 'vitest';
import { ChatService } from '../../src/domain/services/chat-service.js';
import { FavoriteService } from '../../src/domain/services/favorite-service.js';
import { ItemService } from '../../src/domain/services/item-service.js';
import { PurchaseService } from '../../src/domain/services/purchase-service.js';
import { SearchService } from '../../src/domain/services/search-service.js';
import { CapabilityRouter } from '../../src/transports/router/capability-router.js';
import { FakeTransport } from '../helpers/fakes.js';

describe('service integration', () => {
  const browser = new FakeTransport('browser', ['search', 'item', 'chat', 'favorite', 'purchase'], {
    search: [{ id: '1', title: 'Item', url: 'https://m.bunjang.co.kr/products/1', price: 1000, currency: 'KRW' }],
    items: { '1': { id: '1', title: 'Item', url: 'https://m.bunjang.co.kr/products/1', price: 1000, currency: 'KRW', description: 'desc', metadata: {} } },
    chats: [{ id: 't1', title: 'Thread', participants: [] }],
    thread: { id: 't1', title: 'Thread', participants: [], messages: [{ body: 'hello' }] },
    favorites: [{ id: '1', title: 'Fav', url: 'https://m.bunjang.co.kr/products/1', price: 1000, currency: 'KRW' }],
    purchase: { listingId: '1', available: true, stage: 'item-page', nextAction: 'continue', requiresUserConfirmation: true },
  });
  const router = new CapabilityRouter(browser, new FakeTransport('api', []), { preferredTransport: 'browser' });

  it('wires search and item services', async () => {
    const search = new SearchService(router);
    const item = new ItemService(router);
    expect((await search.search('x')).items).toHaveLength(1);
    expect((await item.get('1')).item.description).toBe('desc');
  });

  it('wires chat, favorites, and purchase services', async () => {
    const chat = new ChatService(router);
    const favorite = new FavoriteService(router);
    const purchase = new PurchaseService(router);
    expect((await chat.list()).threads).toHaveLength(1);
    expect((await favorite.list()).items).toHaveLength(1);
    expect((await purchase.prepare('1')).state.stage).toBe('item-page');
  });
});
