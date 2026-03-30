import type {
  ChatThread,
  ChatThreadDetail,
  ListingDetail,
  ListingSummary,
  PurchaseState,
  SearchFilters,
  SessionStatus,
  TransportName,
} from './models.js';

export type Capability =
  | 'auth'
  | 'search'
  | 'item'
  | 'chat'
  | 'favorite'
  | 'purchase';

export interface TransportSelection<T> {
  value: T;
  transportUsed: TransportName;
  fallbackReason?: string;
}

export interface BunjangTransport {
  readonly name: TransportName;
  supports(capability: Capability): Promise<boolean>;
  loginInteractive(): Promise<SessionStatus>;
  getSessionStatus(): Promise<SessionStatus>;
  search(query: string, filters: SearchFilters): Promise<ListingSummary[]>;
  getItem(id: string): Promise<ListingDetail>;
  getItems(ids: string[]): Promise<ListingDetail[]>;
  listChats(): Promise<ChatThread[]>;
  startChat(listingId: string, message: string): Promise<ChatThreadDetail>;
  readChat(threadId: string): Promise<ChatThreadDetail>;
  sendChat(threadId: string, message: string): Promise<ChatThreadDetail>;
  listFavorites(): Promise<ListingSummary[]>;
  addFavorite(listingId: string): Promise<ListingDetail>;
  removeFavorite(listingId: string): Promise<ListingDetail>;
  preparePurchase(listingId: string): Promise<PurchaseState>;
  startPurchase(listingId: string): Promise<PurchaseState>;
}
