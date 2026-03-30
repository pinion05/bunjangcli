import { CapabilityRouter } from '../../transports/router/capability-router.js';

export class PurchaseService {
  constructor(private readonly router: CapabilityRouter) {}

  async prepare(listingId: string) {
    const result = await this.router.preparePurchase(listingId);
    return { state: result.value, transportUsed: result.transportUsed, fallbackReason: result.fallbackReason };
  }

  async start(listingId: string) {
    const result = await this.router.startPurchase(listingId);
    return { state: result.value, transportUsed: result.transportUsed, fallbackReason: result.fallbackReason };
  }
}
