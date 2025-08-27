import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

@Injectable()
export class IdempotencyMiddleware implements NestMiddleware {
  private readonly IDEMPOTENCY_HEADER = 'idempotency-key';
  private readonly MAX_IDEMPOTENCY_KEY_AGE = 24 * 60 * 60 * 1000; // 24 hours

  // In a production app, this would be stored in Redis or database
  private readonly processedKeys = new Map<string, { timestamp: number; response: any }>();

  use(req: Request, res: Response, next: NextFunction): void {
    // Only apply to mutation operations
    if (!this.isMutationRequest(req.method)) {
      return next();
    }

    const idempotencyKey = req.headers[this.IDEMPOTENCY_HEADER] as string;

    if (!idempotencyKey) {
      // Generate a key for mutation requests that don't have one
      const generatedKey = uuidv4();
      req.headers[this.IDEMPOTENCY_HEADER] = generatedKey;
      res.setHeader(this.IDEMPOTENCY_HEADER, generatedKey);
      return next();
    }

    // Validate the idempotency key format
    if (!uuidValidate(idempotencyKey)) {
      throw new BadRequestException(
        `Invalid idempotency key format. Must be a valid UUID.`,
      );
    }

    // Check if this key has been processed before
    const existingResponse = this.processedKeys.get(idempotencyKey);

    if (existingResponse) {
      const age = Date.now() - existingResponse.timestamp;

      if (age > this.MAX_IDEMPOTENCY_KEY_AGE) {
        // Key has expired, remove it and allow reprocessing
        this.processedKeys.delete(idempotencyKey);
      } else {
        // Return the cached response
        res.setHeader(this.IDEMPOTENCY_HEADER, idempotencyKey);
        res.status(existingResponse.response.statusCode || 200);
        return res.json(existingResponse.response.body);
      }
    }

    // Store the original response methods to capture the response
    const originalJson = res.json.bind(res);
    const originalStatus = res.status.bind(res);
    let responseBody: any;
    let statusCode = 200;

    res.json = (body: any) => {
      responseBody = body;
      return originalJson(body);
    };

    res.status = (code: number) => {
      statusCode = code;
      return originalStatus(code);
    };

    // After the request is processed, store the response
    res.on('finish', () => {
      if (responseBody && statusCode >= 200 && statusCode < 300) {
        this.processedKeys.set(idempotencyKey, {
          timestamp: Date.now(),
          response: {
            body: responseBody,
            statusCode,
          },
        });
      }
    });

    next();
  }

  private isMutationRequest(method: string): boolean {
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
  }

  // Method to clean up expired keys (should be called periodically)
  cleanupExpiredKeys(): void {
    const now = Date.now();
    for (const [key, value] of this.processedKeys.entries()) {
      if (now - value.timestamp > this.MAX_IDEMPOTENCY_KEY_AGE) {
        this.processedKeys.delete(key);
      }
    }
  }
}
