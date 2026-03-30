import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SessionStore } from '../../src/config/session-store.js';

describe('SessionStore', () => {
  it('persists metadata in a permission-restricted session file', () => {
    const root = mkdtempSync(join(tmpdir(), 'bunjang-cli-'));
    const store = new SessionStore(root);
    const metadata = store.saveMetadata({ lastLoginAt: '2026-01-01T00:00:00.000Z', lastTransport: 'browser' });
    expect(metadata.lastTransport).toBe('browser');
    expect(store.readMetadata().lastLoginAt).toBe('2026-01-01T00:00:00.000Z');
  });
});
