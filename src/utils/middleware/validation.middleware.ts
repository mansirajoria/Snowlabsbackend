import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class ValidationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // for (const key in req.body) {
    //   if (typeof req.body[key] === 'string') {
    //     req.body[key] = req.body[key].trim();
    //   }
    // }
    next();
  }
}
