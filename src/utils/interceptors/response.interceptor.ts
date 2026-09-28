import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { tap } from 'rxjs';

export interface Response<T> {
  statusCode: number;
  message: string;
  data: T;
  test: any;
}

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler) {
    const req = ctx.switchToHttp().getRequest();
    return next.handle().pipe(
      tap((data) => {
        if (typeof data !== 'string' && !data?.success)
          req.res.status(data?.statusCode ? data?.statusCode : 400);
      }),
    );
  }
}
