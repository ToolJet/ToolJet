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
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let errorResponse: ErrorResponse = { message: exception.message, status: HttpStatus.INTERNAL_SERVER_ERROR };

    switch (exception.constructor) {
      case HttpException:
        errorResponse = { status: exception.getStatus(), message: exception?.response?.message || exception.message };
        break;
      case QueryFailedError:
        errorResponse = this.handleQueryExceptions(exception);
        break;
      default:
        break;
    }

    if (errorResponse.status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception);
    }

    response.status(errorResponse.status).json({
      statusCode: errorResponse.status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: errorResponse.message,
    });
  }

  private handleQueryExceptions(exception: any): ErrorResponse {
    const status = HttpStatus.UNPROCESSABLE_ENTITY;
    const code = (exception as any).code;
    let message: string = (exception as QueryFailedError).message;

    switch (code) {
      case PostgresErrorCode.UniqueViolation:
        message = 'Already Existed!';
        break;
      case PostgresErrorCode.CheckViolation:
        message = 'Validation Failed!';
        break;
      case PostgresErrorCode.ForeignKeyViolation:
        message = 'Foreign key validation error.';
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
