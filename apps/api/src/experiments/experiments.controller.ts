import { Body, Controller, Get, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ExperimentsService } from './experiments.service';

@ApiTags('experiments')
@ApiBearerAuth('JWT-auth')
@Controller('experiments')
export class ExperimentsController {
  constructor(private readonly experimentsService: ExperimentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create A/B experiment' })
  @ApiResponse({ status: HttpStatus.CREATED })
  create(@Body() body: any) {
    return this.experimentsService.createExperiment(body);
  }

  @Get()
  @ApiOperation({ summary: 'List experiments' })
  @ApiResponse({ status: HttpStatus.OK })
  list() {
    return this.experimentsService.listExperiments();
  }
}


