import type { BunjangTransport, Capability, TransportSelection } from '../../domain/transport.js';
import type {
  ChatThread,
  ChatThreadDetail,
  ListingDetail,
  ListingSummary,
  PurchaseState,
  SearchFilters,
  SessionStatus,
  TransportName,
} from '../../domain/models.js';

export interface RouterOptions {
  preferredTransport?: 'auto' | TransportName;
}

export class CapabilityRouter {
  constructor(
    private readonly browser: BunjangTransport,
    private readonly api: BunjangTransport,
    private readonly options: RouterOptions = {},
  ) {}

  async loginInteractive(): Promise<TransportSelection<SessionStatus>> {
    const value = await this.browser.loginInteractive();
    return { value, transportUsed: 'browser' };
  }

  async getSessionStatus(): Promise<TransportSelection<SessionStatus>> {
    const value = await this.browser.getSessionStatus();
    return { value, transportUsed: 'browser' };
  }

  async search(query: string, filters: SearchFilters): Promise<TransportSelection<ListingSummary[]>> {
    return this.route('search', (transport) => transport.search(query, filters));
  }

  async getItem(id: string): Promise<TransportSelection<ListingDetail>> {
    return this.route('item', (transport) => transport.getItem(id));
  }

  async getItems(ids: string[]): Promise<TransportSelection<ListingDetail[]>> {
    return this.route('item', (transport) => transport.getItems(ids));
  }

  async listChats(): Promise<TransportSelection<ChatThread[]>> {
    return this.route('chat', (transport) => transport.listChats());
  }

  async startChat(listingId: string, message: string): Promise<TransportSelection<ChatThreadDetail>> {
    return this.route('chat', (transport) => transport.startChat(listingId, message));
  }

  async readChat(threadId: string): Promise<TransportSelection<ChatThreadDetail>> {
    return this.route('chat', (transport) => transport.readChat(threadId));
  }

  async sendChat(threadId: string, message: string): Promise<TransportSelection<ChatThreadDetail>> {
    return this.route('chat', (transport) => transport.sendChat(threadId, message));
  }

  async listFavorites(): Promise<TransportSelection<ListingSummary[]>> {
    return this.route('favorite', (transport) => transport.listFavorites());
  }

  async addFavorite(listingId: string): Promise<TransportSelection<ListingDetail>> {
    return this.route('favorite', (transport) => transport.addFavorite(listingId));
  }

  async removeFavorite(listingId: string): Promise<TransportSelection<ListingDetail>> {
    return this.route('favorite', (transport) => transport.removeFavorite(listingId));
  }

  async preparePurchase(listingId: string): Promise<TransportSelection<PurchaseState>> {
    return this.route('purchase', (transport) => transport.preparePurchase(listingId));
  }

  async startPurchase(listingId: string): Promise<TransportSelection<PurchaseState>> {
    return this.route('purchase', (transport) => transport.startPurchase(listingId));
  }

  private async route<T>(capability: Capability, invoke: (transport: BunjangTransport) => Promise<T>): Promise<TransportSelection<T>> {
    const ordered = this.orderedTransports(capability);
    let lastError: unknown;
    let fallbackReason: string | undefined;
    for (const transport of ordered) {
      if (!(await transport.supports(capability))) continue;
      try {
        const value = await invoke(transport);
        return { value, transportUsed: transport.name, fallbackReason };
      } catch (error) {
        lastError = error;
        fallbackReason = `${transport.name} failed: ${error instanceof Error ? error.message : String(error)}`;
      }
    }
    throw lastError instanceof Error ? lastError : new Error(`No transport available for capability ${capability}.`);
  }

  private orderedTransports(capability: Capability): BunjangTransport[] {
    const preferred = this.options.preferredTransport ?? 'auto';
    if (preferred === 'browser') return [this.browser, this.api];
    if (preferred === 'api') return [this.api, this.browser];
    if (capability === 'item') return [this.api, this.browser];
    return [this.browser, this.api];
  }
}
