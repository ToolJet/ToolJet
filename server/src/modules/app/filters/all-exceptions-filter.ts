import { TooljetDatabaseError } from '@modules/tooljet-db/types';
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { QueryFailedError } from 'typeorm';

interface ErrorResponse {
  message: string;
  status: number;
}

enum PostgresErrorCode {
  UniqueViolation = '23505',
  CheckViolation = '23514',
  NotNullViolation = '23502',
  ForeignKeyViolation = '23503',
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: any, host: ArgumentsHost) {
    try {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse();
      const request = ctx.getRequest();

      this.logger.error(
        {
          method: request.method,
          url: request.url,
          headers: request.headers,
          exception,
        },
        exception.stack
      );

      let errorResponse: ErrorResponse;
      const message = exception?.response?.message || exception.message;
      const code = exception?.code;

      if (exception instanceof HttpException) {
        errorResponse = { status: exception.getStatus(), message };
      } else if (exception instanceof TooljetDatabaseError) {
        errorResponse = { status: HttpStatus.CONFLICT, message: exception.toString() };
      } else if (exception instanceof QueryFailedError) {
        errorResponse = this.handleQueryExceptions(exception);
      } else {
        errorResponse = { message, status: HttpStatus.INTERNAL_SERVER_ERROR };
      }

      response.status(errorResponse.status).json({
        statusCode: errorResponse.status,
        timestamp: new Date().toISOString(),
        path: request.url,
        message: errorResponse.message,
        code: code,
      });
    } catch (error) {
      this.logger.error('Error while processing uncaught exception', error.stack);
    }
  }

  private handleQueryExceptions(exception: any): ErrorResponse {
    const status = HttpStatus.UNPROCESSABLE_ENTITY;
    const code = (exception as any).code;
    let message: string = (exception as QueryFailedError).message;

    switch (code) {
      case PostgresErrorCode.UniqueViolation:
        message = 'Already exists!';
        break;
      case PostgresErrorCode.NotNullViolation: {
        const driverError: any = (exception as QueryFailedError).driverError;
        if (typeof driverError === 'string') {
          message = driverError;
        } else {
          const column = driverError.column;
          message = `${column.replace(/_/g, ' ')} is required`;
        }
        break;
      }
    }

    return {
      message,
      status,
    };
  }
}
