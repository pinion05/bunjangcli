import type { ListingDetail } from '../models.js';
import { CapabilityRouter } from '../../transports/router/capability-router.js';

export class ItemService {
  constructor(private readonly router: CapabilityRouter) {}

  async get(
    id: string,
  ): Promise<{ item: ListingDetail; transportUsed: string; fallbackReason?: string }> {
    const result = await this.router.getItem(id);
    return {
      item: { ...result.value, transportUsed: result.transportUsed, fallbackReason: result.fallbackReason },
      transportUsed: result.transportUsed,
      fallbackReason: result.fallbackReason,
    };
  }

  async list(
    ids: string[],
  ): Promise<{ items: ListingDetail[]; transportUsed: string; fallbackReason?: string }> {
    const result = await this.router.getItems(ids);
    return {
      items: result.value.map((item) => ({ ...item, transportUsed: result.transportUsed })),
      transportUsed: result.transportUsed,
      fallbackReason: result.fallbackReason,
    };
  }
}
