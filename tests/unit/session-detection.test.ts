import { describe, expect, it } from 'vitest';
import { detectAuthenticatedSession } from '../../src/transports/browser/session-detection.js';

describe('detectAuthenticatedSession', () => {
  it('rejects explicit login pages', () => {
    const result = detectAuthenticatedSession({
      url: 'https://m.bunjang.co.kr/login',
      bodyText: '카카오로 이용하기',
      cookieNames: [],
    });
    expect(result.authenticated).toBe(false);
  });

  it('accepts pages with auth-like cookies and no login CTA', () => {
    const result = detectAuthenticatedSession({
      url: 'https://m.bunjang.co.kr/',
      bodyText: '홈 채팅 마이페이지',
      cookieNames: ['BGZT_SESSION'],
    });
    expect(result.authenticated).toBe(true);
    expect(result.detectedBy).toBe('auth-cookie');
  });

  it('rejects non-empty public pages without positive auth signals', () => {
    const result = detectAuthenticatedSession({
      url: 'https://m.bunjang.co.kr/',
      bodyText: '홈 추천 검색',
      cookieNames: [],
    });
    expect(result.authenticated).toBe(false);
    expect(result.detectedBy).toBe('missing-positive-auth-signal');
  });
});
