import { CapabilityRouter } from '../../transports/router/capability-router.js';

export class FavoriteService {
  constructor(private readonly router: CapabilityRouter) {}

  async list() {
    const result = await this.router.listFavorites();
    return { items: result.value, transportUsed: result.transportUsed, fallbackReason: result.fallbackReason };
  }

  async add(listingId: string) {
    const result = await this.router.addFavorite(listingId);
    return { item: result.value, transportUsed: result.transportUsed, fallbackReason: result.fallbackReason };
  }

  async remove(listingId: string) {
    const result = await this.router.removeFavorite(listingId);
    return { item: result.value, transportUsed: result.transportUsed, fallbackReason: result.fallbackReason };
  }
}
