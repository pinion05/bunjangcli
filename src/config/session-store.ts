import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export interface SessionMetadata {
  lastLoginAt: string | null;
  lastTransport: 'browser' | 'api' | null;
}

export class SessionStore {
  readonly rootDir: string;
  readonly userDataDir: string;
  readonly metadataPath: string;

  constructor(rootDir = process.env.BUNJANG_CONFIG_DIR ?? join(homedir(), '.config', 'bunjang-cli')) {
    this.rootDir = rootDir;
    this.userDataDir = join(rootDir, 'browser-profile');
    this.metadataPath = join(rootDir, 'session.json');
  }

  ensure(): void {
    mkdirSync(this.rootDir, { recursive: true });
    mkdirSync(this.userDataDir, { recursive: true });
  }

  profileExists(): boolean {
    return existsSync(this.userDataDir);
  }

  readMetadata(): SessionMetadata {
    if (!existsSync(this.metadataPath)) {
      return { lastLoginAt: null, lastTransport: null };
    }
    const raw = readFileSync(this.metadataPath, 'utf8');
    return JSON.parse(raw) as SessionMetadata;
  }

  saveMetadata(partial: Partial<SessionMetadata>): SessionMetadata {
    this.ensure();
    const next = { ...this.readMetadata(), ...partial } satisfies SessionMetadata;
    writeFileSync(this.metadataPath, JSON.stringify(next, null, 2), 'utf8');
    try {
      chmodSync(this.metadataPath, 0o600);
    } catch {
      // best effort on non-POSIX environments
    }
    return next;
  }

  clear(): void {
    rmSync(this.rootDir, { recursive: true, force: true });
  }
}
