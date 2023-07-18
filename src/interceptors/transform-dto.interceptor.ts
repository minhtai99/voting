import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { Observable, firstValueFrom, of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

interface Response<T> {
  new (): T;
}

@Injectable()
export class TransformDtoInterceptor<T>
  implements NestInterceptor<T, Partial<T>>
{
  constructor(private classType: Response<T>) {}
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<T>> {
    return next.handle().pipe(
      switchMap(async (payload) => {
        if (payload === undefined) return payload;
        if (payload.data && payload.data.length > 0) {
          payload.data = await firstValueFrom(
            of(payload.data).pipe(
              map((data) => plainToClass(this.classType, data)),
            ),
          );
        }
        if (payload.data && payload.data.length === undefined) {
          payload.data = plainToClass(this.classType, payload.data);
        }
        return payload;
      }),
    );
  }
}
