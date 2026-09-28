import { Request, Response, NextFunction } from 'express';
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    // const { ip, method, originalUrl } = request;
    // const userAgent = request.get('user-agent') || '';

    // response.on("finish", () => {
    //     const { statusCode } = response;
    //     const contentLength = response.get("content-length");
    //     // const responseTime =
    //     this.logger.log(
    //         {
    //             "Method": method,
    //             "URL": originalUrl,
    //             'status code': statusCode,
    //             'content length': contentLength,
    //             'user agent': userAgent,
    //             'IP': ip,
    //         });
    // });

    next();
  }
}
