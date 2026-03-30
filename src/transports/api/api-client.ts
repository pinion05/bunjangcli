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
    const [html, descriptionPayload] = await Promise.all([
      this.fetchText(`https://mercari.bunjang.co.kr/products/${encodeURIComponent(id)}`),
      this.fetchJson(`https://api.bunjang.co.kr/api/pms/v1/mercari/products/${encodeURIComponent(id)}/description`).catch(
        () => ({} as Record<string, unknown>),
      ),
    ]);
    const nestedDescription =
      typeof descriptionPayload.data === 'object' &&
      descriptionPayload.data !== null &&
      'descriptionJp' in descriptionPayload.data &&
      typeof descriptionPayload.data.descriptionJp === 'string'
        ? descriptionPayload.data.descriptionJp
        : null;
    const description =
      typeof descriptionPayload.description === 'string' ? descriptionPayload.description : nestedDescription;
    const title =
      this.readMeta(html, 'og:title') ??
      this.readJsonLdField(html, 'name') ??
      `Listing ${id}`;
    const imageUrl = this.readMeta(html, 'og:image');
    const descriptionText = description ?? this.readMeta(html, 'og:description');
    const price = this.readJsonLdNumber(html, 'price');
    return {
      id: String(id),
      title,
      url: `https://mercari.bunjang.co.kr/products/${encodeURIComponent(id)}`,
      price,
      currency: 'KRW',
      imageUrl,
      description: descriptionText,
      metadata: {
        ogTitle: title,
        ogDescription: descriptionText ?? '',
      },
      transportUsed: 'api',
      raw: { descriptionPayload, htmlExcerpt: html.slice(0, 2000) },
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

  private readMeta(html: string, property: string): string | null {
    const patterns = [
      new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
      new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) return match[1];
    }
    return null;
  }

  private readJsonLdField(html: string, field: string): string | null {
    const match = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
    if (!match?.[1]) return null;
    try {
      const payload = JSON.parse(match[1]) as Record<string, unknown>;
      const value = payload[field];
      return typeof value === 'string' ? value : null;
    } catch {
      return null;
    }
  }

  private readJsonLdNumber(html: string, field: string): number | null {
    const match = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
    if (!match?.[1]) return null;
    try {
      const payload = JSON.parse(match[1]) as Record<string, unknown>;
      const directValue = payload[field];
      if (typeof directValue === 'number') return directValue;
      if (typeof directValue === 'string') {
        const digits = directValue.replace(/[^0-9]/g, '');
        if (digits) return Number(digits);
      }
      const offers = payload.offers;
      if (Array.isArray(offers)) {
        const firstOffer = offers.find(
          (entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null,
        );
        const offerPrice = firstOffer?.price;
        if (typeof offerPrice === 'number') return offerPrice;
        if (typeof offerPrice === 'string') {
          const digits = offerPrice.replace(/[^0-9]/g, '');
          return digits ? Number(digits) : null;
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  private unsupported(capability: Capability): Error {
    return new Error(`API transport does not currently support ${capability}. Configure browser transport for this command.`);
  }
}
