import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';
import { ValidationError } from 'class-validator';
import { ZodError } from 'zod';

export interface ProblemJson {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>;
  requestId?: string;
  timestamp: string;
}

@Catch()
export class ProblemJsonExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemJsonExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let problem: ProblemJson;

    if (exception instanceof HttpException) {
      problem = this.handleHttpException(exception, request);
    } else if (exception instanceof QueryFailedError) {
      problem = this.handleDatabaseError(exception, request);
    } else if (exception instanceof EntityNotFoundError) {
      problem = this.handleEntityNotFoundError(exception, request);
    } else if (exception instanceof ZodError) {
      problem = this.handleZodError(exception, request);
    } else if (this.isValidationError(exception)) {
      problem = this.handleValidationError(exception, request);
    } else {
      problem = this.handleUnknownError(exception, request);
    }

    // Add request ID if available
    const requestId = (request as any).id;
    if (requestId) {
      problem.requestId = requestId;
    }

    // Log error for debugging (except in production for certain types)
    if (problem.status >= 500 || process.env.NODE_ENV === 'development') {
      this.logger.error(
        `Problem JSON Response: ${JSON.stringify(problem)}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(problem.status).json(problem);
  }

  private handleHttpException(exception: HttpException, request: Request): ProblemJson {
    const status = exception.getStatus();
    const response = exception.getResponse();

    let title: string;
    let detail: string;

    if (typeof response === 'string') {
      title = response;
      detail = response;
    } else if (typeof response === 'object' && response !== null) {
      const errorResponse = response as any;
      title = errorResponse.message || errorResponse.error || 'HTTP Exception';
      detail = Array.isArray(errorResponse.message)
        ? errorResponse.message.join(', ')
        : errorResponse.message || title;
    } else {
      title = 'HTTP Exception';
      detail = 'An HTTP exception occurred';
    }

    return {
      type: `https://httpstatuses.com/${status}`,
      title,
      status,
      detail,
      instance: request.url,
      timestamp: new Date().toISOString(),
    };
  }

  private handleDatabaseError(exception: QueryFailedError, request: Request): ProblemJson {
    const status = HttpStatus.BAD_REQUEST;
    let title = 'Database Error';
    let detail = 'A database operation failed';

    // Handle specific database errors
    if (exception.message.includes('duplicate key value')) {
      title = 'Resource Already Exists';
      detail = 'A resource with these details already exists';
      status = HttpStatus.CONFLICT;
    } else if (exception.message.includes('violates foreign key constraint')) {
      title = 'Invalid Reference';
      detail = 'The referenced resource does not exist';
    } else if (exception.message.includes('violates not-null constraint')) {
      title = 'Missing Required Field';
      detail = 'A required field was not provided';
    }

    return {
      type: 'https://example.com/problems/database-error',
      title,
      status,
      detail,
      instance: request.url,
      timestamp: new Date().toISOString(),
    };
  }

  private handleEntityNotFoundError(exception: EntityNotFoundError, request: Request): ProblemJson {
    return {
      type: 'https://example.com/problems/resource-not-found',
      title: 'Resource Not Found',
      status: HttpStatus.NOT_FOUND,
      detail: 'The requested resource could not be found',
      instance: request.url,
      timestamp: new Date().toISOString(),
    };
  }

  private handleZodError(exception: ZodError, request: Request): ProblemJson {
    const errors: Record<string, string[]> = {};

    exception.errors.forEach((error) => {
      const path = error.path.join('.');
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(error.message);
    });

    return {
      type: 'https://example.com/problems/validation-error',
      title: 'Validation Failed',
      status: HttpStatus.BAD_REQUEST,
      detail: 'The provided data is invalid',
      instance: request.url,
      errors,
      timestamp: new Date().toISOString(),
    };
  }

  private isValidationError(exception: unknown): exception is { errors: ValidationError[] } {
    return (
      typeof exception === 'object' &&
      exception !== null &&
      'errors' in exception &&
      Array.isArray((exception as any).errors) &&
      (exception as any).errors.length > 0 &&
      (exception as any).errors[0] instanceof ValidationError
    );
  }

  private handleValidationError(
    exception: { errors: ValidationError[] },
    request: Request,
  ): ProblemJson {
    const errors: Record<string, string[]> = {};

    const processValidationError = (error: ValidationError, path = '') => {
      const currentPath = path ? `${path}.${error.property}` : error.property;

      if (error.constraints) {
        errors[currentPath] = Object.values(error.constraints);
      }

      if (error.children && error.children.length > 0) {
        error.children.forEach((child) => {
          processValidationError(child, currentPath);
        });
      }
    };

    exception.errors.forEach((error) => processValidationError(error));

    return {
      type: 'https://example.com/problems/validation-error',
      title: 'Validation Failed',
      status: HttpStatus.BAD_REQUEST,
      detail: 'The provided data is invalid',
      instance: request.url,
      errors,
      timestamp: new Date().toISOString(),
    };
  }

  private handleUnknownError(exception: unknown, request: Request): ProblemJson {
    const error = exception instanceof Error ? exception : new Error(String(exception));

    return {
      type: 'https://example.com/problems/internal-server-error',
      title: 'Internal Server Error',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      detail: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
      instance: request.url,
      timestamp: new Date().toISOString(),
    };
  }
}
