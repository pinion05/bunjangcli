import { SessionStore } from '../config/session-store.js';
import { AgentSearchRankService } from '../domain/services/agent-search-rank-service.js';
import { ChatService } from '../domain/services/chat-service.js';
import { FavoriteService } from '../domain/services/favorite-service.js';
import { ItemService } from '../domain/services/item-service.js';
import { PurchaseService } from '../domain/services/purchase-service.js';
import { SearchExportService } from '../domain/services/search-export-service.js';
import { SearchService } from '../domain/services/search-service.js';
import { SessionService } from '../domain/services/session-service.js';
import type { TransportName } from '../domain/models.js';
import { ApiClient } from '../transports/api/api-client.js';
import { BrowserClient } from '../transports/browser/browser-client.js';
import { CapabilityRouter } from '../transports/router/capability-router.js';

export interface AppContextOptions {
  debug?: boolean;
  preferredTransport?: 'auto' | TransportName;
}

export function createAppContext(options: AppContextOptions = {}) {
  const store = new SessionStore();
  const browser = new BrowserClient(store, { debug: options.debug });
  const api = new ApiClient(store, { debug: options.debug });
  const router = new CapabilityRouter(browser, api, { preferredTransport: options.preferredTransport ?? 'auto' });

  const searchService = new SearchService(router);
  const itemService = new ItemService(router);

  return {
    store,
    router,
    sessionService: new SessionService(router, store),
    searchService,
    itemService,
    chatService: new ChatService(router),
    favoriteService: new FavoriteService(router),
    purchaseService: new PurchaseService(router),
    agentSearchRankService: new AgentSearchRankService(searchService, itemService),
    searchExportService: new SearchExportService(searchService, itemService),
  };
}
