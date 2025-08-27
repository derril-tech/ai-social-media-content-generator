import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class WebhooksService {
  verifySignature(secret: string, payload: string, signature: string): boolean {
    if (!secret || !signature) return false;
    const digest = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  }
}


