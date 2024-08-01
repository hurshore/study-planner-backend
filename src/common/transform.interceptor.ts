import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ServiceResponse } from './interfaces/service-response.interface';

export interface Response<T> {
  success: boolean;
  data: T;
  message: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((res) => {
        if (this.isServiceResponse(res)) {
          return {
            success: true,
            data: res.data,
            message: res.message,
          };
        }
        return {
          success: true,
          data: res,
          message: 'operation successful',
        };
      }),
    );
  }

  private isServiceResponse(res: any): res is ServiceResponse<T> {
    return res && typeof res === 'object' && 'data' in res && 'message' in res;
  }
}
