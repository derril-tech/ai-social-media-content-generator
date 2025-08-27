import { Controller, Get, Param, Patch, Body, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { VariantsService } from './variants.service';

@ApiTags('variants')
@ApiBearerAuth('JWT-auth')
@Controller('variants')
export class VariantsController {
  constructor(private readonly variantsService: VariantsService) {}

  @Get('post/:postId')
  @ApiOperation({ summary: 'Get variants by post ID' })
  @ApiParam({ name: 'postId' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Variants retrieved' })
  findByPost(@Param('postId') postId: string) {
    return this.variantsService.findByPost(postId);
  }

  @Patch(':id/score')
  @ApiOperation({ summary: 'Update variant score' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Variant scored' })
  score(@Param('id') id: string, @Body() body: { score: any }) {
    return this.variantsService.scoreVariant(id, body.score);
  }

  @Patch(':id/rewrite')
  @ApiOperation({ summary: 'Rewrite variant content' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Variant rewritten' })
  rewrite(@Param('id') id: string, @Body() body: { content: string }) {
    return this.variantsService.rewrite(id, body.content);
  }
}


