import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { connect, NatsConnection } from 'nats';
import { NatsService } from './nats.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'NATS_CONNECTION',
      useFactory: async (config: ConfigService): Promise<NatsConnection> => {
        const url = config.get<string>('NATS_URL') || 'nats://localhost:4222';
        return await connect({ servers: url });
      },
      inject: [ConfigService],
    },
    NatsService,
  ],
  exports: ['NATS_CONNECTION', NatsService],
})
export class NatsModule {}


