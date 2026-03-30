import { CapabilityRouter } from '../../transports/router/capability-router.js';

export class ChatService {
  constructor(private readonly router: CapabilityRouter) {}

  async list() {
    const result = await this.router.listChats();
    return { threads: result.value, transportUsed: result.transportUsed, fallbackReason: result.fallbackReason };
  }

  async start(listingId: string, message: string) {
    const result = await this.router.startChat(listingId, message);
    return { thread: result.value, transportUsed: result.transportUsed, fallbackReason: result.fallbackReason };
  }

  async read(threadId: string) {
    const result = await this.router.readChat(threadId);
    return { thread: result.value, transportUsed: result.transportUsed, fallbackReason: result.fallbackReason };
  }

  async send(threadId: string, message: string) {
    const result = await this.router.sendChat(threadId, message);
    return { thread: result.value, transportUsed: result.transportUsed, fallbackReason: result.fallbackReason };
  }
}
