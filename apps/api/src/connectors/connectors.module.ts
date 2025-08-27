import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConnectorsService } from './connectors.service';
import { ConnectorsController } from './connectors.controller';
import { Connector } from './entities/connector.entity';
import { BrandsModule } from '../brands/brands.module';
import { MembershipsModule } from '../memberships/memberships.module';

@Module({
  imports: [TypeOrmModule.forFeature([Connector]), BrandsModule, MembershipsModule],
  controllers: [ConnectorsController],
  providers: [ConnectorsService],
  exports: [ConnectorsService],
})
export class ConnectorsModule {}


