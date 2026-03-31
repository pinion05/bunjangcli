import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { encode } from '@toon-format/toon';
import { estimateTokens } from './token-estimator.js';

export const AI_CHUNK_TOKEN_LIMIT = 50_000;

export interface ToonChunk {
  index: number;
  filename: string;
  items: unknown[];
  content: string;
  tokenCount: number;
}

export function serializeToToon(value: unknown): string {
  return encode(value);
}

function serializeChunk(items: unknown[]): string {
  return serializeToToon({ items });
}

export function buildToonChunks<T>(
  items: T[],
  options: { tokenLimit?: number } = {},
): Array<ToonChunk & { items: T[] }> {
  const tokenLimit = options.tokenLimit ?? AI_CHUNK_TOKEN_LIMIT;
  const chunks: Array<ToonChunk & { items: T[] }> = [];
  let currentItems: T[] = [];

  const flushCurrent = () => {
    if (currentItems.length === 0) return;
    const index = chunks.length + 1;
    const content = serializeChunk(currentItems);
    chunks.push({
      index,
      filename: `items-${index}.toon`,
      items: [...currentItems],
      content,
      tokenCount: estimateTokens(content),
    });
    currentItems = [];
  };

  for (const item of items) {
    if (currentItems.length === 0) {
      currentItems = [item];
      if (estimateTokens(serializeChunk(currentItems)) > tokenLimit) flushCurrent();
      continue;
    }

    const candidateItems = [...currentItems, item];
    if (estimateTokens(serializeChunk(candidateItems)) <= tokenLimit) {
      currentItems = candidateItems;
      continue;
    }

    flushCurrent();
    currentItems = [item];
    if (estimateTokens(serializeChunk(currentItems)) > tokenLimit) flushCurrent();
  }

  flushCurrent();
  return chunks;
}

export function emitToonChunks(
  outputDir: string,
  items: unknown[],
  options: { tokenLimit?: number } = {},
): ToonChunk[] {
  const chunks = buildToonChunks(items, options);
  mkdirSync(outputDir, { recursive: true });
  for (const chunk of chunks) {
    writeFileSync(join(outputDir, chunk.filename), chunk.content, 'utf8');
  }
  return chunks;
}
