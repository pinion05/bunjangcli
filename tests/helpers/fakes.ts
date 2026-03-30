import type { BunjangTransport, Capability } from '../../src/domain/transport.js';
import type {
  ChatThread,
  ChatThreadDetail,
  ListingDetail,
  ListingSummary,
  PurchaseState,
  SearchFilters,
  SessionStatus,
  TransportName,
} from '../../src/domain/models.js';

export class FakeTransport implements BunjangTransport {
  constructor(
    public readonly name: TransportName,
    private readonly capabilities: Capability[],
    private readonly data: {
      search?: ListingSummary[];
      items?: Record<string, ListingDetail>;
      chats?: ChatThread[];
      thread?: ChatThreadDetail;
      favorites?: ListingSummary[];
      purchase?: PurchaseState;
      status?: SessionStatus;
    } = {},
  ) {}

  async supports(capability: Capability): Promise<boolean> { return this.capabilities.includes(capability); }
  async loginInteractive(): Promise<SessionStatus> { return this.data.status ?? this.defaultStatus(); }
  async getSessionStatus(): Promise<SessionStatus> { return this.data.status ?? this.defaultStatus(); }
  async search(_query: string, _filters: SearchFilters): Promise<ListingSummary[]> { return this.data.search ?? []; }
  async getItem(id: string): Promise<ListingDetail> { return this.data.items?.[id] ?? this.defaultItem(id); }
  async getItems(ids: string[]): Promise<ListingDetail[]> { return Promise.all(ids.map((id) => this.getItem(id))); }
  async listChats(): Promise<ChatThread[]> { return this.data.chats ?? []; }
  async startChat(_listingId: string, _message: string): Promise<ChatThreadDetail> { return this.readChat('1'); }
  async readChat(_threadId: string): Promise<ChatThreadDetail> { return this.data.thread ?? { id: '1', title: 'Thread', participants: [], messages: [] }; }
  async sendChat(_threadId: string, _message: string): Promise<ChatThreadDetail> { return this.readChat('1'); }
  async listFavorites(): Promise<ListingSummary[]> { return this.data.favorites ?? []; }
  async addFavorite(id: string): Promise<ListingDetail> { return this.getItem(id); }
  async removeFavorite(id: string): Promise<ListingDetail> { return this.getItem(id); }
  async preparePurchase(listingId: string): Promise<PurchaseState> { return this.data.purchase ?? { listingId, available: true, stage: 'item-page', nextAction: 'next', requiresUserConfirmation: true }; }
  async startPurchase(listingId: string): Promise<PurchaseState> { return this.data.purchase ?? { listingId, available: true, stage: 'ready-for-manual-confirmation', nextAction: 'stop', requiresUserConfirmation: true }; }

  private defaultStatus(): SessionStatus {
    return { authenticated: true, profileExists: true, userDataDir: '/tmp/profile', metadataPath: '/tmp/session.json', headfulLoginRequired: false };
  }

  private defaultItem(id: string): ListingDetail {
    return { id, title: `Item ${id}`, url: `https://m.bunjang.co.kr/products/${id}`, price: 1000, currency: 'KRW', description: 'desc', metadata: {}, transportUsed: this.name };
  }
}
