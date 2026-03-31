import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { assertAiRequirements } from '../../src/commands/search.js';
import type { SearchExportResult } from '../../src/domain/services/search-export-service.js';
import { writeSearchExport } from '../../src/output/search-export-writer.js';

function makeResult(): SearchExportResult {
  return {
    query: '테스트',
    filters: { maxItems: 2 },
    collectedAt: '2026-04-01T00:00:00.000Z',
    searchTransport: 'browser',
    itemTransport: 'browser',
    items: [
      {
        sourcePage: 1,
        summary: {
          id: '1',
          title: 'Item 1',
          url: 'https://m.bunjang.co.kr/products/1',
          price: 1000,
          currency: 'KRW',
        },
      },
      {
        sourcePage: 1,
        summary: {
          id: '2',
          title: 'Item 2',
          url: 'https://m.bunjang.co.kr/products/2',
          price: 2000,
          currency: 'KRW',
        },
      },
    ],
  };
}

describe('search AI export validation', () => {
  it('requires --output when --ai is enabled', () => {
    expect(() => assertAiRequirements({ ai: true, output: undefined })).toThrow(
      'AI export requires --output to point to an explicit destination directory.',
    );
  });

  it('fails fast on .json file-like output paths before collection starts', () => {
    expect(() => assertAiRequirements({ ai: true, output: 'artifacts/export.json' })).toThrow(
      'AI export expects --output to be a directory path, not a .json file path.',
    );
  });

  it('rejects an existing .json file path in AI mode', () => {
    const root = mkdtempSync(join(tmpdir(), 'bunjang-ai-cli-'));
    const outputPath = join(root, 'existing.json');
    writeFileSync(outputPath, '{}', 'utf8');

    expect(() => assertAiRequirements({ ai: true, output: outputPath })).toThrow(
      'AI export expects --output to point to a directory, not an existing file.',
    );
    expect(() => writeSearchExport(makeResult(), { outputPath, ai: true })).toThrow(
      'AI export expects --output to point to a directory, not an existing file.',
    );
  });

  it('keeps JSON export behavior unchanged when AI mode is off', () => {
    const root = mkdtempSync(join(tmpdir(), 'bunjang-json-cli-'));
    const outputPath = join(root, 'items.json');

    const writeResult = writeSearchExport(makeResult(), { outputPath, ai: false });

    expect(writeResult.mode).toBe('json');
    expect(writeResult.files).toHaveLength(0);
    expect(JSON.parse(readFileSync(outputPath, 'utf8'))).toMatchObject({
      query: '테스트',
      items: [{ summary: { id: '1' } }, { summary: { id: '2' } }],
    });
  });
});
