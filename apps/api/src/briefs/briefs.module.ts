import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BriefsService } from './briefs.service';
import { BriefsController } from './briefs.controller';
import { Brief } from './entities/brief.entity';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { MembershipsModule } from '../memberships/memberships.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Brief]),
    CampaignsModule,
    MembershipsModule,
  ],
  controllers: [BriefsController],
  providers: [BriefsService],
  exports: [BriefsService],
})
export class BriefsModule {}
