import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message = 'An error occurred';

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      if (
        'message' in exceptionResponse &&
        exceptionResponse.message !== undefined
      ) {
        if (Array.isArray(exceptionResponse.message)) {
          message = exceptionResponse.message[0];
        } else if (typeof exceptionResponse.message === 'string') {
          message = exceptionResponse.message;
        }
      }
    }

    response.status(status).json({
      success: false,
      data: null,
      message,
    });
  }
}
