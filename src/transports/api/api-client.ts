import { SessionStore } from '../../config/session-store.js';
import {
  type ChatThread,
  type ChatThreadDetail,
  type ListingDetail,
  type ListingSummary,
  type PurchaseState,
  type SearchFilters,
  type SessionStatus,
} from '../../domain/models.js';
import type { BunjangTransport, Capability } from '../../domain/transport.js';

interface ApiClientOptions {
  baseUrl?: string;
  debug?: boolean;
}

export class ApiClient implements BunjangTransport {
  readonly name = 'api' as const;
  private readonly baseUrl?: string;
  private readonly store: SessionStore;
  private readonly debug: boolean;

  constructor(store = new SessionStore(), options: ApiClientOptions = {}) {
    this.store = store;
    this.baseUrl = options.baseUrl ?? process.env.BUNJANG_API_BASE_URL;
    this.debug = options.debug ?? false;
  }

  async supports(capability: Capability): Promise<boolean> {
    if (capability === 'item') return true;
    return Boolean(this.baseUrl) && capability === 'search';
  }

  async loginInteractive(): Promise<SessionStatus> {
    throw new Error('API transport does not support interactive login. Use browser transport.');
  }

  async getSessionStatus(): Promise<SessionStatus> {
    return {
      authenticated: Boolean(this.baseUrl) && this.store.readMetadata().lastLoginAt !== null,
      profileExists: this.store.profileExists(),
      userDataDir: this.store.userDataDir,
      metadataPath: this.store.metadataPath,
      headfulLoginRequired: this.store.readMetadata().lastLoginAt === null,
      lastLoginAt: this.store.readMetadata().lastLoginAt,
      detectedBy: 'api-config',
    };
  }

  async search(query: string, filters: SearchFilters): Promise<ListingSummary[]> {
    const json = await this.fetchJson('/search', {
      q: query,
      priceMin: filters.priceMin,
      priceMax: filters.priceMax,
      limit: filters.maxItems,
    });
    const items = Array.isArray(json.items) ? json.items : [];
    return items.map((item) => ({
      id: String(item.id),
      title: String(item.title ?? `Listing ${item.id}`),
      url: String(item.url ?? ''),
      price: typeof item.price === 'number' ? item.price : null,
      currency: 'KRW' as const,
      imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : null,
      transportUsed: 'api' as const,
      raw: item,
    }));
  }

  async getItem(id: string): Promise<ListingDetail> {
    const payload = await this.fetchJson(`https://api.bunjang.co.kr/api/pms/v3/products-detail/${encodeURIComponent(id)}`, {
      viewerUid: -1,
    });
    const data = typeof payload.data === 'object' && payload.data !== null ? payload.data : {};
    const product = this.asRecord(data.product);
    const shop = this.asRecord(data.shop);
    const metrics = this.asRecord(product.metrics);
    const geo = this.asRecord(product.geo);
    const categories = Array.isArray(product.categories) ? product.categories.map((entry) => this.asRecord(entry)) : [];
    const keywords = Array.isArray(product.keywords) ? product.keywords.map((entry) => this.asRecord(entry)) : [];
    const trades = Array.isArray(product.trades) ? product.trades.map((entry) => this.asRecord(entry)) : [];
    const shippingTrade = trades.find((entry) => entry.title === '배송비');
    const inPersonTrade = trades.find((entry) => entry.title === '직거래 희망 장소');
    const shippingContent = this.asRecord(shippingTrade?.content);
    const shippingSub = Array.isArray(shippingContent.sub) ? shippingContent.sub.map((entry) => this.asRecord(entry)) : [];
    const inPersonContent = this.asRecord(inPersonTrade?.content);
    const inPersonMain = this.asRecord(inPersonContent.main);
    const categoryPath = categories
      .map((entry) => entry.name)
      .filter((value): value is string => typeof value === 'string' && value.length > 0)
      .join(' > ');
    const tags = keywords
      .map((entry) => entry.keyword)
      .filter((value): value is string => typeof value === 'string' && value.length > 0);

    return {
      id: String(id),
      title: typeof product.name === 'string' ? product.name : `Listing ${id}`,
      url: `https://m.bunjang.co.kr/products/${encodeURIComponent(id)}`,
      price: typeof product.price === 'number' ? product.price : null,
      currency: 'KRW',
      imageUrl: this.normalizeImageUrl(product.imageUrl),
      description: typeof product.description === 'string' ? product.description.replace(/\n{3,}/g, '\n\n').trim() : null,
      location:
        (typeof inPersonMain.text === 'string' && inPersonMain.text) ||
        (typeof geo.address === 'string' ? geo.address : null),
      category: categoryPath || null,
      status: this.mapCondition(typeof product.condition === 'string' ? product.condition : ''),
      shippingFee: typeof shippingSub[0]?.text === 'string' ? shippingSub[0].text : null,
      sellerName: typeof shop.name === 'string' ? shop.name : null,
      sellerItemCount: typeof data.shopProductCount === 'number' ? data.shopProductCount : null,
      sellerFollowerCount: typeof shop.followerCount === 'number' ? shop.followerCount : null,
      sellerReviewCount: typeof shop.reviewCount === 'number' ? shop.reviewCount : null,
      sellerSalesCount: typeof shop.salesCount === 'number' ? shop.salesCount : null,
      favoriteCount: typeof metrics.favoriteCount === 'number' ? metrics.favoriteCount : null,
      tags,
      metadata: {},
      transportUsed: 'api',
    };
  }

  async getItems(ids: string[]): Promise<ListingDetail[]> {
    return Promise.all(ids.map((id) => this.getItem(id)));
  }

  async listChats(): Promise<ChatThread[]> { throw this.unsupported('chat'); }
  async startChat(_listingId: string, _message: string): Promise<ChatThreadDetail> { throw this.unsupported('chat'); }
  async readChat(_threadId: string): Promise<ChatThreadDetail> { throw this.unsupported('chat'); }
  async sendChat(_threadId: string, _message: string): Promise<ChatThreadDetail> { throw this.unsupported('chat'); }
  async listFavorites(): Promise<ListingSummary[]> { throw this.unsupported('favorite'); }
  async addFavorite(_listingId: string): Promise<ListingDetail> { throw this.unsupported('favorite'); }
  async removeFavorite(_listingId: string): Promise<ListingDetail> { throw this.unsupported('favorite'); }
  async preparePurchase(_listingId: string): Promise<PurchaseState> { throw this.unsupported('purchase'); }
  async startPurchase(_listingId: string): Promise<PurchaseState> { throw this.unsupported('purchase'); }

  private async fetchJson(path: string, params?: Record<string, string | number | undefined>) {
    const url = path.startsWith('http') ? new URL(path) : new URL(path, this.baseUrl);
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    if (this.debug) console.error('[api]', url.toString());
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`API request failed (${response.status}) for ${url}`);
    }
    return response.json() as Promise<Record<string, any>>;
  }

  private async fetchText(url: string): Promise<string> {
    if (this.debug) console.error('[api:text]', url);
    const response = await fetch(url, { headers: { Accept: 'text/html,application/xhtml+xml' } });
    if (!response.ok) {
      throw new Error(`Text request failed (${response.status}) for ${url}`);
    }
    return response.text();
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};
  }

  private normalizeImageUrl(value: unknown): string | null {
    if (typeof value !== 'string' || value.length === 0) return null;
    return value.replace('{cnt}', '1').replace('{res}', '840');
  }

  private mapCondition(condition: string): string | null {
    const lookup: Record<string, string> = {
      NEW: '새상품',
      LIKE_NEW: '사용감 없음',
      LIGHTLY_USED: '사용감 적음',
      USED: '사용감 있음',
    };
    return lookup[condition] ?? (condition || null);
  }

  private unsupported(capability: Capability): Error {
    return new Error(`API transport does not currently support ${capability}. Configure browser transport for this command.`);
  }
}
