import { SessionStore } from '../../config/session-store.js';
import type { SessionStatus } from '../models.js';
import { CapabilityRouter } from '../../transports/router/capability-router.js';

export class SessionService {
  constructor(
    private readonly router: CapabilityRouter,
    private readonly store: SessionStore,
  ) {}

  async login() {
    const result = await this.router.loginInteractive();
    return { status: result.value, transportUsed: result.transportUsed };
  }

  async status() {
    const result = await this.router.getSessionStatus();
    return { status: result.value, transportUsed: result.transportUsed };
  }

  async logout() {
    this.store.clear();
    return { status: this.loggedOutStatus(), transportUsed: 'browser' as const };
  }

  private loggedOutStatus(): SessionStatus {
    return {
      authenticated: false,
      profileExists: this.store.profileExists(),
      userDataDir: this.store.userDataDir,
      metadataPath: this.store.metadataPath,
      headfulLoginRequired: true,
      lastLoginAt: null,
      detectedBy: 'missing-session-metadata',
    };
  }
}
