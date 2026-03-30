import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SessionStore } from '../../src/config/session-store.js';

describe('session metadata guardrails', () => {
  it('does not claim authentication without a recorded login', () => {
    const root = mkdtempSync(join(tmpdir(), 'bunjang-session-'));
    const store = new SessionStore(root);
    store.ensure();
    const metadata = store.readMetadata();
    expect(metadata.lastLoginAt).toBeNull();
  });
});
