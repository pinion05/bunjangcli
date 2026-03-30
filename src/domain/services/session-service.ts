import { CapabilityRouter } from '../../transports/router/capability-router.js';

export class SessionService {
  constructor(private readonly router: CapabilityRouter) {}

  async login() {
    const result = await this.router.loginInteractive();
    return { status: result.value, transportUsed: result.transportUsed };
  }

  async status() {
    const result = await this.router.getSessionStatus();
    return { status: result.value, transportUsed: result.transportUsed };
  }
}
