import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SessionStore } from '../../src/config/session-store.js';
import { SessionService } from '../../src/domain/services/session-service.js';
import { CapabilityRouter } from '../../src/transports/router/capability-router.js';
import { FakeTransport } from '../helpers/fakes.js';

describe('session metadata guardrails', () => {
  it('does not claim authentication without a recorded login', () => {
    const root = mkdtempSync(join(tmpdir(), 'bunjang-session-'));
    const store = new SessionStore(root);
    store.ensure();
    const metadata = store.readMetadata();
    expect(metadata.lastLoginAt).toBeNull();
  });

  it('clears the local session and reports a logged-out status', async () => {
    const root = mkdtempSync(join(tmpdir(), 'bunjang-session-'));
    const store = new SessionStore(root);
    store.ensure();
    store.saveMetadata({ lastLoginAt: '2026-01-01T00:00:00.000Z', lastTransport: 'browser' });

    const router = new CapabilityRouter(
      new FakeTransport('browser', ['auth']),
      new FakeTransport('api', []),
      { preferredTransport: 'browser' },
    );
    const service = new SessionService(router, store);

    const result = await service.logout();

    expect(result.transportUsed).toBe('browser');
    expect(result.status.authenticated).toBe(false);
    expect(result.status.profileExists).toBe(false);
    expect(result.status.lastLoginAt).toBeNull();
    expect(result.status.detectedBy).toBe('missing-session-metadata');
  });
});
