import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import type { SearchExportItem, SearchExportResult } from '../domain/services/search-export-service.js';
import { AI_CHUNK_TOKEN_LIMIT, buildToonChunks } from './toon.js';

export const DEFAULT_AI_CHUNK_TOKENS = AI_CHUNK_TOKEN_LIMIT;

export interface SearchExportChunkFile {
  file: string;
  itemCount: number;
  approxTokens: number;
  oversizedSingleItem: boolean;
}

export interface SearchExportWriteResult {
  mode: 'json' | 'ai';
  output: string;
  count: number;
  files: SearchExportChunkFile[];
}

interface AiExportRow {
  sourcePage: string;
  id: string;
  title: string;
  url: string;
  price: string;
  currency: string;
  imageUrl: string;
  description: string;
  status: string;
  shippingFee: string;
  directTradeArea: string;
  categoryPath: string;
  tags: string;
  sellerName: string;
  sellerItemCount: string;
  sellerFollowerCount: string;
  sellerReviewCount: string;
  sellerSalesCount: string;
  favoriteCount: string;
  searchTransport: string;
  detailTransport: string;
  error: string;
}

function asString(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

function normalizeAiRow(item: SearchExportItem): AiExportRow {
  const detail = item.detail;
  const summary = item.summary;
  return {
    sourcePage: asString(item.sourcePage),
    id: summary.id,
    title: detail?.title || summary.title || '',
    url: detail?.url || summary.url || '',
    price: asString(detail?.price ?? summary.price),
    currency: detail?.currency || summary.currency || '',
    imageUrl: detail?.imageUrl || summary.imageUrl || '',
    description: detail?.description || '',
    status: detail?.status || '',
    shippingFee: detail?.shippingFee || '',
    directTradeArea: detail?.location || '',
    categoryPath: detail?.category || '',
    tags: detail?.tags?.join(',') ?? '',
    sellerName: detail?.sellerName || '',
    sellerItemCount: asString(detail?.sellerItemCount),
    sellerFollowerCount: asString(detail?.sellerFollowerCount),
    sellerReviewCount: asString(detail?.sellerReviewCount),
    sellerSalesCount: asString(detail?.sellerSalesCount),
    favoriteCount: asString(detail?.favoriteCount ?? summary.favoriteCount),
    searchTransport: summary.transportUsed || '',
    detailTransport: detail?.transportUsed || '',
    error: item.error || '',
  };
}

export function planAiChunks(
  items: SearchExportItem[],
  targetTokens = DEFAULT_AI_CHUNK_TOKENS,
): Array<{ items: AiExportRow[]; content: string; approxTokens: number; oversizedSingleItem: boolean }> {
  const normalized = items.map((item) => normalizeAiRow(item));
  return buildToonChunks(normalized, { tokenLimit: targetTokens }).map((chunk) => ({
    items: chunk.items,
    content: chunk.content,
    approxTokens: chunk.tokenCount,
    oversizedSingleItem: chunk.items.length === 1 && chunk.tokenCount > targetTokens,
  }));
}

export function resolveAiOutputDir(outputPath: string): string {
  const resolved = resolve(outputPath);
  if (existsSync(resolved)) {
    if (!statSync(resolved).isDirectory()) {
      throw new Error('AI export expects --output to point to a directory, not an existing file.');
    }
    return resolved;
  }

  if (extname(resolved).toLowerCase() === '.json') {
    throw new Error('AI export expects --output to be a directory path, not a .json file path.');
  }

  return resolved;
}

export function writeSearchExport(
  result: SearchExportResult,
  options: { outputPath: string; ai?: boolean; targetTokens?: number },
): SearchExportWriteResult {
  if (!options.ai) {
    const output = resolve(options.outputPath);
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, JSON.stringify(result, null, 2), 'utf8');
    return {
      mode: 'json',
      output,
      count: result.items.length,
      files: [],
    };
  }

  const output = resolveAiOutputDir(options.outputPath);
  mkdirSync(output, { recursive: true });
  const chunks = planAiChunks(result.items, options.targetTokens ?? DEFAULT_AI_CHUNK_TOKENS);
  const files = chunks.map((chunk, index) => {
    const file = join(output, `items-${index + 1}.toon`);
    writeFileSync(file, chunk.content, 'utf8');
    return {
      file,
      itemCount: chunk.items.length,
      approxTokens: chunk.approxTokens,
      oversizedSingleItem: chunk.oversizedSingleItem,
    };
  });

  return {
    mode: 'ai',
    output,
    count: result.items.length,
    files,
  };
}
