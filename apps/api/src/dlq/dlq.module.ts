import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DLQMessage } from './entities/dlq-message.entity';
import { DLQService } from './services/dlq.service';
import { DLQController } from './controllers/dlq.controller';
import { ObservabilityModule } from '../observability/observability.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DLQMessage]),
    ObservabilityModule,
  ],
  providers: [DLQService],
  controllers: [DLQController],
  exports: [DLQService],
})
export class DLQModule {}
