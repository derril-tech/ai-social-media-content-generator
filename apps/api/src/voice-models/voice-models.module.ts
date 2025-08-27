import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoiceModelsService } from './voice-models.service';
import { VoiceModelsController } from './voice-models.controller';
import { VoiceModel } from './entities/voice-model.entity';
import { BrandsModule } from '../brands/brands.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VoiceModel]),
    BrandsModule,
  ],
  controllers: [VoiceModelsController],
  providers: [VoiceModelsService],
  exports: [VoiceModelsService],
})
export class VoiceModelsModule {}
