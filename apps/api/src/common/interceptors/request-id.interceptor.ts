import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Add request ID to response headers if not already present
    const requestId = (request as any).id;
    if (requestId && !response.getHeader('x-request-id')) {
      response.setHeader('x-request-id', requestId);
    }

    return next.handle().pipe(
      tap(() => {
        // Ensure request ID is in the response
        if (requestId) {
          response.setHeader('x-request-id', requestId);
        }
      }),
    );
  }
}
