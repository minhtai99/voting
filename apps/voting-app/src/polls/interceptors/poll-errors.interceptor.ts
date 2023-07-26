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
          if (error.response) {
            if (
              error.status === 400 &&
              error.response.message === 'Unexpected field'
            ) {
              error.response.message = 'Limit images to only 10 files';
            }
            throw new HttpException(error.response, error.status);
          }
          throw new Error(error);
        }),
      ),
    );
  }
}
