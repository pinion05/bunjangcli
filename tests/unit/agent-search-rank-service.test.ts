import { describe, expect, it } from 'vitest';
import { AgentSearchRankService } from '../../src/domain/services/agent-search-rank-service.js';
import { ItemService } from '../../src/domain/services/item-service.js';
import { SearchExportService } from '../../src/domain/services/search-export-service.js';
import { SearchService } from '../../src/domain/services/search-service.js';
import { CapabilityRouter } from '../../src/transports/router/capability-router.js';
import { FakeTransport } from '../helpers/fakes.js';

describe('AgentSearchRankService', () => {
  it('returns ranked listings with rationale', async () => {
    const listings = [
      { id: '1', title: '아이폰 15 Pro 256GB A급', url: 'https://m.bunjang.co.kr/products/1', price: 1200000, currency: 'KRW' as const },
      { id: '2', title: '아이폰 15 Pro 256GB', url: 'https://m.bunjang.co.kr/products/2', price: 1300000, currency: 'KRW' as const },
    ];
    const details = {
      '1': { ...listings[0], description: '상태 좋음 박스 포함', metadata: {} },
      '2': { ...listings[1], description: '생활기스 있음', metadata: {} },
    };
    const browser = new FakeTransport('browser', ['search', 'item'], { search: listings, items: details });
    const api = new FakeTransport('api', []);
    const router = new CapabilityRouter(browser, api, { preferredTransport: 'browser' });
    const service = new AgentSearchRankService(new SearchService(router), new ItemService(router));
    const result = await service.run('아이폰 15 Pro 256GB', { maxItems: 2 });
    expect(result.ranked).toHaveLength(2);
    expect(result.ranked[0]?.reasons.length).toBeGreaterThan(0);
  });

  it('can collect search results with detail payloads for export', async () => {
    const listings = [
      { id: '1', title: '갤럭시 S25 울트라', url: 'https://m.bunjang.co.kr/products/1', price: 1000000, currency: 'KRW' as const },
      { id: '2', title: '갤럭시 S25 울트라 512', url: 'https://m.bunjang.co.kr/products/2', price: 1100000, currency: 'KRW' as const },
    ];
    const details = {
      '1': { ...listings[0], description: '본문 1', metadata: {} },
      '2': { ...listings[1], description: '본문 2', metadata: {} },
    };
    const browser = new FakeTransport('browser', ['search', 'item'], { search: listings, items: details });
    const api = new FakeTransport('api', []);
    const router = new CapabilityRouter(browser, api, { preferredTransport: 'browser' });
    const service = new SearchExportService(new SearchService(router), new ItemService(router));
    const result = await service.collect('갤럭시 s25 울트라', { maxItems: 2 }, { withDetail: true, concurrency: 2 });
    expect(result.items).toHaveLength(2);
    expect(result.items[0]?.detail?.description).toBe('본문 1');
  });
});
