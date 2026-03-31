import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { decode } from '@toon-format/toon';
import type { SearchExportResult } from '../../src/domain/services/search-export-service.js';
import { DEFAULT_AI_CHUNK_TOKENS, planAiChunks, writeSearchExport } from '../../src/output/search-export-writer.js';
import { serializeToToon } from '../../src/output/toon.js';

function makeResult(descriptions: string[]): SearchExportResult {
  return {
    query: '갤럭시 s25 울트라',
    filters: { maxItems: descriptions.length },
    collectedAt: '2026-04-01T00:00:00.000Z',
    searchTransport: 'browser',
    itemTransport: 'browser',
    items: descriptions.map((description, index) => ({
      sourcePage: index + 1,
      summary: {
        id: String(index + 1),
        title: `Item ${index + 1}`,
        url: `https://m.bunjang.co.kr/products/${index + 1}`,
        price: 1000 + index,
        currency: 'KRW',
        raw: { page: index + 1 },
      },
      detail: {
        id: String(index + 1),
        title: `Item ${index + 1}`,
        url: `https://m.bunjang.co.kr/products/${index + 1}`,
        price: 1000 + index,
        currency: 'KRW',
        description,
        metadata: { seller: 'tester' },
      },
    })),
  };
}

describe('search export writer', () => {
  it('writes the legacy JSON export unchanged when ai mode is disabled', () => {
    const root = mkdtempSync(join(tmpdir(), 'bunjang-export-'));
    const outputPath = join(root, 'items.json');
    const result = makeResult(['본문 1']);
    const before = JSON.parse(JSON.stringify(result));

    const writeResult = writeSearchExport(result, { outputPath });
    const written = JSON.parse(readFileSync(outputPath, 'utf8')) as SearchExportResult;

    expect(writeResult.mode).toBe('json');
    expect(writeResult.output).toBe(outputPath);
    expect(written).toEqual(before);
    expect(result).toEqual(before);
  });

  it('writes AI chunks as items-<n>.toon files without mutating the source result', () => {
    const root = mkdtempSync(join(tmpdir(), 'bunjang-ai-export-'));
    const outputDir = join(root, 'toon');
    const result = makeResult(['짧은 본문', '다른 본문']);
    const before = JSON.parse(JSON.stringify(result));

    const writeResult = writeSearchExport(result, { outputPath: outputDir, ai: true, targetTokens: DEFAULT_AI_CHUNK_TOKENS });

    expect(writeResult.mode).toBe('ai');
    expect(writeResult.files).toHaveLength(1);
    expect(writeResult.files[0]?.file).toBe(join(outputDir, 'items-1.toon'));
    expect(existsSync(join(outputDir, 'items-1.toon'))).toBe(true);
    const toonText = readFileSync(join(outputDir, 'items-1.toon'), 'utf8');
    expect(toonText).toContain('items[2]{sourcePage,id,title,url,price,currency,imageUrl,description,status,shippingFee,directTradeArea,categoryPath,tags,sellerName,sellerItemCount,sellerFollowerCount,sellerReviewCount,sellerSalesCount,favoriteCount,searchTransport,detailTransport,error}:');
    expect(toonText).not.toContain('htmlExcerpt');
    const parsed = decode(toonText) as { items: Array<Record<string, string>> };
    expect(Object.keys(parsed.items[0] ?? {})).toEqual(Object.keys(parsed.items[1] ?? {}));
    expect(parsed.items[0]?.error).toBe('');
    expect(result).toEqual(before);
  });

  it('rejects ambiguous .json output paths in ai mode', () => {
    const result = makeResult(['본문 1']);
    expect(() => writeSearchExport(result, { outputPath: 'artifacts/export.json', ai: true })).toThrow(/directory path, not a \.json file path/i);

    const root = mkdtempSync(join(tmpdir(), 'bunjang-ai-output-'));
    const filePath = join(root, 'existing.json');
    writeFileSync(filePath, '{}', 'utf8');
    expect(() => writeSearchExport(result, { outputPath: filePath, ai: true })).toThrow(/directory, not an existing file/i);
  });

  it('splits chunks greedily under the token target', () => {
    const result = makeResult(['a'.repeat(40), 'b'.repeat(40), 'c'.repeat(40)]);
    const chunks = planAiChunks(result.items, 70);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.items.length === 1 || chunk.approxTokens <= 70)).toBe(true);
    expect(chunks.map((chunk) => chunk.items.length).reduce((sum, count) => sum + count, 0)).toBe(result.items.length);
  });

  it('emits oversized single items as standalone chunks', () => {
    const result = makeResult(['x'.repeat(300)]);
    const chunks = planAiChunks(result.items, 20);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.items).toHaveLength(1);
    expect(chunks[0]?.oversizedSingleItem).toBe(true);
    expect(chunks[0]?.approxTokens).toBeGreaterThan(20);
  });
});

describe('TOON serializer', () => {
  it('preserves insertion order for object fields', () => {
    expect(serializeToToon({ beta: 1, alpha: 2, nested: { first: 'x', second: 'y' } })).toBe(
      ['beta: 1', 'alpha: 2', 'nested:', '  first: x', '  second: y'].join('\n'),
    );
  });
});
