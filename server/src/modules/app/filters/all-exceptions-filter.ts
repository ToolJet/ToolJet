import { TooljetDatabaseError } from '@modules/tooljet-db/types';
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { SentryExceptionCaptured } from '@sentry/nestjs';
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

// Allow list, not deny list: a header we did not think of must not reach the log.
const LOGGABLE_HEADERS = [
  'user-agent',
  'content-type',
  'accept',
  'origin',
  'referer',
  'x-request-id',
  'tj-workspace-id',
];

function pickLoggableHeaders(headers: Record<string, unknown> = {}): Record<string, unknown> {
  return Object.fromEntries(LOGGABLE_HEADERS.filter((name) => name in headers).map((name) => [name, headers[name]]));
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  @SentryExceptionCaptured()
  catch(exception: any, host: ArgumentsHost) {
    try {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse();
      const request = ctx.getRequest();

      this.logger.error(
        {
          method: request.method,
          url: request.url,
          headers: pickLoggableHeaders(request.headers),
          exception,
        },
        exception.stack
      );

      const INVITE_EXPIRY_MESSAGES = ['WORKSPACE_INVITE_LINK_EXPIRED', 'INVITATION_LINK_EXPIRED'];
      let errorResponse: ErrorResponse;
      const message = exception?.response?.message || exception.message;
      const code = exception?.code;
      // Some HttpExceptions (e.g. promote's toPostgresError) put a `statement` alongside `message`
      // on the response body — the failing SQL, useful only to the caller who can act on it.
      const statement = exception?.response?.statement;
      const organizationSlug = INVITE_EXPIRY_MESSAGES.includes(message)
        ? exception?.response?.organizationSlug
        : undefined;
      // AppValidationException: clients (e.g. the MCP) need the full problem list.
      const validationIssues = Array.isArray(exception?.response?.issues) ? exception.response.issues : undefined;
      const validationWarnings = Array.isArray(exception?.response?.warnings) ? exception.response.warnings : [];
      // A machine-readable reason a client can act on, when the exception carries one.
      const reason = typeof exception?.response?.reason === 'string' ? exception.response.reason : undefined;

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
        ...(statement && { statement }),
        ...(organizationSlug && { organizationSlug }),
        ...(validationIssues && { issues: validationIssues, warnings: validationWarnings }),
        // AI parallel-run refusal: app of the running action
        ...(exception?.runningApp && { runningApp: exception.runningApp }),
        ...(reason && { reason }),
      });
    } catch (error) {
      this.logger.error('Error while processing uncaught exception', (error as any).stack);
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
