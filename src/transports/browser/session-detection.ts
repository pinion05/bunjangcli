export interface SessionSignals {
  url: string;
  bodyText: string;
  cookieNames: string[];
}

export interface SessionDetectionResult {
  authenticated: boolean;
  detectedBy: string;
}

const AUTH_COOKIE_PATTERNS = [/session/i, /auth/i, /token/i, /member/i, /user/i];
const LOGIN_TEXT_PATTERNS = ['로그인', '카카오로 이용하기', '본인인증으로 이용하기'];
const AUTH_TEXT_PATTERNS = ['마이페이지', '내 상점', '로그아웃', '판매내역', '구매내역'];

export function detectAuthenticatedSession(signals: SessionSignals): SessionDetectionResult {
  const bodyText = signals.bodyText.replace(/\s+/g, ' ').trim();
  if (signals.url.includes('/login')) {
    return { authenticated: false, detectedBy: 'login-url' };
  }

  if (LOGIN_TEXT_PATTERNS.some((text) => bodyText.includes(text))) {
    return { authenticated: false, detectedBy: 'login-cta' };
  }

  if (signals.cookieNames.some((name) => AUTH_COOKIE_PATTERNS.some((pattern) => pattern.test(name)))) {
    return { authenticated: true, detectedBy: 'auth-cookie' };
  }

  if (AUTH_TEXT_PATTERNS.some((text) => bodyText.includes(text))) {
    return { authenticated: true, detectedBy: 'auth-marker' };
  }

  return { authenticated: false, detectedBy: bodyText.length > 0 ? 'missing-positive-auth-signal' : 'empty-page' };
}
