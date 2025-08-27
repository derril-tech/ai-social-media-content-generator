import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Extend Express Request interface to include our custom properties
declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // Generate or use existing request ID
    const requestId = req.headers['x-request-id'] as string || uuidv4();

    // Attach request ID to request object
    req.id = requestId;

    // Add request ID to response headers
    res.setHeader('x-request-id', requestId);

    // Add to response locals for use in templates/views
    res.locals.requestId = requestId;

    next();
  }
}
