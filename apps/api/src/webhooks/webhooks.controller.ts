import { Body, Controller, Headers, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('platform')
  @HttpCode(HttpStatus.ACCEPTED)
  async handlePlatformWebhook(
    @Headers('x-signature') signature: string,
    @Body() body: any,
  ) {
    const payload = JSON.stringify(body);
    const secret = process.env.WEBHOOK_SECRET || '';
    const ok = this.webhooksService.verifySignature(secret, payload, signature || '');
    if (!ok) return { accepted: false };
    // TODO: enqueue for metrics/process
    return { accepted: true };
  }
}


