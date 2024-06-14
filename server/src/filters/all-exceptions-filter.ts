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
      this.logger.error(exception);
      const ctx = host.switchToHttp();
      const response = ctx.getResponse();
      const request = ctx.getRequest();

      let errorResponse: ErrorResponse;
      const message = exception?.response?.message || exception.message;

      if (exception instanceof HttpException) {
        errorResponse = { status: exception.getStatus(), message };
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
      });
    } catch (error) {
      this.logger.error('Error while processing uncaught exception', error);
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
        const column = (exception as QueryFailedError).driverError.column;
        message = `${column.replace(/_/g, ' ')} is empty`;
        break;
      }
    }

    return {
      message,
      status,
    };
  }
}
