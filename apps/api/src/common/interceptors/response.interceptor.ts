import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request, Response } from 'express';

interface ApiResponse<T> {
  success: true;
  data: T;
  timestamp: string;
  requestId?: string;
  path: string;
  method: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        // If the response is already formatted (e.g., Problem JSON), return as-is
        if (data && typeof data === 'object' && ('type' in data || 'success' in data)) {
          return data;
        }

        const requestId = (request as any).id;

        return {
          success: true,
          data,
          timestamp: new Date().toISOString(),
          requestId,
          path: request.path,
          method: request.method,
        };
      }),
    );
  }
}
