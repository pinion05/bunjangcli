import { describe, expect, it } from 'vitest';
import { CapabilityRouter } from '../../src/transports/router/capability-router.js';
import { FakeTransport } from '../helpers/fakes.js';

describe('CapabilityRouter', () => {
  it('prefers browser for search in auto mode', async () => {
    const browser = new FakeTransport('browser', ['search'], { search: [] });
    const api = new FakeTransport('api', ['search'], {
      search: [{ id: '1', title: 'API item', url: 'https://m.bunjang.co.kr/products/1', price: 1000, currency: 'KRW' }],
    });
    const router = new CapabilityRouter(browser, api);
    const result = await router.search('iphone', {});
    expect(result.transportUsed).toBe('browser');
  });

  it('falls back to browser when api does not support the capability', async () => {
    const browser = new FakeTransport('browser', ['chat'], { chats: [{ id: 't1', title: 'Browser chat', participants: [] }] });
    const api = new FakeTransport('api', ['search']);
    const router = new CapabilityRouter(browser, api);
    const result = await router.listChats();
    expect(result.transportUsed).toBe('browser');
    expect(result.value[0]?.title).toContain('Browser');
  });

  it('returns a fallback reason when the preferred transport fails', async () => {
    const browser = new FakeTransport('browser', ['item'], {
      items: {
        '1': {
          id: '1',
          title: 'Browser item',
          url: 'https://m.bunjang.co.kr/products/1',
          price: 1000,
          currency: 'KRW',
          description: 'ok',
          metadata: {},
        },
      },
    });
    const api = new FakeTransport('api', ['item']);
    api.getItem = async () => {
      throw new Error('api unavailable');
    };
    const router = new CapabilityRouter(browser, api, { preferredTransport: 'api' });
    const result = await router.getItem('1');
    expect(result.transportUsed).toBe('browser');
    expect(result.fallbackReason).toContain('api unavailable');
  });
});
