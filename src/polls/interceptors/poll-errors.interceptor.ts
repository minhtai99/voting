import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class UploadFilesErrorsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) =>
        throwError(() => {
          if (
            error.status === 400 &&
            error.response.message === 'Unexpected field'
          ) {
            error.response.message = 'Limit images to only 10 files';
          }
          const payload = {
            status: error.response.statusCode,
            message: error.response.message,
            error: error.response.error,
          };
          throw new HttpException(payload, error.status);
        }),
      ),
    );
  }
}
