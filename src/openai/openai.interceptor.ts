import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';

interface ExtendedRequest extends Request {
  bearerToken?: string;
  body: {
    stream?: boolean;
    [key: string]: any;
  };
}

@Injectable()
export class OpenaiInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request: ExtendedRequest = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers['authorization'];
    const bearerToken: string | null = authHeader
      ? authHeader.split(' ')[1]
      : null;

    if (!bearerToken) {
      throw new Error('Authorization token is missing');
    }

    request.bearerToken = bearerToken;
    return next.handle();
  }
}
