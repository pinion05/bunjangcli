import { z } from 'zod';

export const TransportNameSchema = z.enum(['browser', 'api']);
export type TransportName = z.infer<typeof TransportNameSchema>;

export const SearchFiltersSchema = z.object({
  priceMin: z.number().int().nonnegative().optional(),
  priceMax: z.number().int().nonnegative().optional(),
  maxItems: z.number().int().positive().max(1000).optional(),
  startPage: z.number().int().positive().optional(),
  pages: z.number().int().positive().max(100).optional(),
  sort: z.enum(['score', 'date', 'price_asc', 'price_desc']).optional(),
}).strict();
export type SearchFilters = z.infer<typeof SearchFiltersSchema>;

export const ListingSummarySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url(),
  price: z.number().int().nonnegative().nullable(),
  currency: z.literal('KRW').default('KRW'),
  imageUrl: z.string().url().nullable().optional(),
  sellerName: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  favoriteCount: z.number().int().nonnegative().nullable().optional(),
  transportUsed: TransportNameSchema.optional(),
  fallbackReason: z.string().nullable().optional(),
  raw: z.record(z.string(), z.unknown()).optional(),
});
export type ListingSummary = z.infer<typeof ListingSummarySchema>;

export const ListingDetailSchema = ListingSummarySchema.extend({
  description: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  shippingFee: z.string().nullable().optional(),
  shippingAvailable: z.boolean().optional(),
  sellerId: z.string().nullable().optional(),
  sellerItemCount: z.number().int().nonnegative().nullable().optional(),
  sellerFollowerCount: z.number().int().nonnegative().nullable().optional(),
  sellerReviewCount: z.number().int().nonnegative().nullable().optional(),
  sellerSalesCount: z.number().int().nonnegative().nullable().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.string()).default({}),
});
export type ListingDetail = z.infer<typeof ListingDetailSchema>;

export const ChatThreadSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url().optional(),
  participants: z.array(z.string()).default([]),
  lastMessage: z.string().nullable().optional(),
  unreadCount: z.number().int().nonnegative().optional(),
  transportUsed: TransportNameSchema.optional(),
});
export type ChatThread = z.infer<typeof ChatThreadSchema>;

export const ChatMessageSchema = z.object({
  id: z.string().nullable().optional(),
  sender: z.string().nullable().optional(),
  body: z.string().min(1),
  timestamp: z.string().nullable().optional(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatThreadDetailSchema = ChatThreadSchema.extend({
  messages: z.array(ChatMessageSchema).default([]),
});
export type ChatThreadDetail = z.infer<typeof ChatThreadDetailSchema>;

export const SessionStatusSchema = z.object({
  authenticated: z.boolean(),
  profileExists: z.boolean(),
  userDataDir: z.string(),
  metadataPath: z.string(),
  headfulLoginRequired: z.boolean(),
  lastLoginAt: z.string().nullable().optional(),
  detectedBy: z.string().optional(),
});
export type SessionStatus = z.infer<typeof SessionStatusSchema>;

export const PurchaseStateSchema = z.object({
  listingId: z.string().min(1),
  available: z.boolean(),
  stage: z.enum(['unavailable', 'item-page', 'offer-opened', 'ready-for-manual-confirmation']),
  nextAction: z.string(),
  requiresUserConfirmation: z.boolean().default(true),
  transportUsed: TransportNameSchema.optional(),
  raw: z.record(z.string(), z.unknown()).optional(),
});
export type PurchaseState = z.infer<typeof PurchaseStateSchema>;

export const RankedListingSchema = z.object({
  listing: ListingDetailSchema,
  score: z.number(),
  reasons: z.array(z.string()).min(1),
});
export type RankedListing = z.infer<typeof RankedListingSchema>;

export const SearchRankResultSchema = z.object({
  query: z.string().min(1),
  evaluatedCount: z.number().int().nonnegative(),
  ranked: z.array(RankedListingSchema),
});
export type SearchRankResult = z.infer<typeof SearchRankResultSchema>;
