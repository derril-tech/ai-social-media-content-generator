import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChaosTestsService } from './chaos-tests.service';
import { ChaosTestsController } from './chaos-tests.controller';
import { Post } from '../posts/entities/post.entity';
import { Connector } from '../connectors/entities/connector.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, Connector]),
  ],
  controllers: [ChaosTestsController],
  providers: [ChaosTestsService],
  exports: [ChaosTestsService],
})
export class ChaosTestsModule {}
