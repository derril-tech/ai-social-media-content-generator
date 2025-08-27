import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TemplatesService } from './templates.service';

@ApiTags('templates')
@ApiBearerAuth('JWT-auth')
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  @ApiOperation({ summary: 'Create template' })
  @ApiResponse({ status: 201 })
  create(@Body() body: any) {
    return this.templatesService.createTemplate(body);
  }

  @Get()
  @ApiOperation({ summary: 'List templates' })
  @ApiResponse({ status: 200 })
  list(@Query('type') type?: string) {
    return this.templatesService.listTemplates(type);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get template by ID' })
  @ApiResponse({ status: 200 })
  get(@Param('id') id: string) {
    return this.templatesService.getTemplate(id);
  }
}
