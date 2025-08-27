import { Injectable, Inject, Logger } from '@nestjs/common';
import { NatsConnection } from 'nats';

@Injectable()
export class NatsService {
  private readonly logger = new Logger(NatsService.name);

  constructor(@Inject('NATS_CONNECTION') private readonly nc: NatsConnection) {}

  async publish(subject: string, data: unknown): Promise<void> {
    const payload = Buffer.from(JSON.stringify(data));
    await this.nc.publish(subject, payload);
  }
}


