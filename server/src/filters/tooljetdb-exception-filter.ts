import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

enum PostgresErrorCode {
  NotNullViolation = '23502',
  ForeignKeyViolation = '23503',
  UniqueViolation = '23505',
}

@Catch()
export class TooljetDbExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const next = ctx.getNext();
    const response = ctx.getResponse();

    if (exception instanceof QueryFailedError) {
      const statusCode = HttpStatus.CONFLICT;
      const code = (exception as any).code;
      let message = (exception as QueryFailedError).message;

      switch (code) {
        case PostgresErrorCode.NotNullViolation:
          message = 'Violates not null constraint';
          break;
        case PostgresErrorCode.ForeignKeyViolation:
          message = 'Violates foreign key constraint';
          break;
        case PostgresErrorCode.UniqueViolation:
          message = 'Violates unique constraint';
          break;
      }
      response.status(statusCode).json({
        statusCode: statusCode,
        message: message,
      });
    } else {
      next(exception);
    }
  }
}
