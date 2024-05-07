import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { TooljetDatabaseError } from 'src/modules/tooljet_db/tooljet-db.types';
import { Logger } from 'nestjs-pino';

@Catch()
export class TooljetDbExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const next = ctx.getNext();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    if (exception instanceof TooljetDatabaseError) {
      const statusCode = HttpStatus.CONFLICT;
      const message = exception.toString();

      this.logger.error(
        {
          method: request.method,
          url: request.url,
          headers: request.headers,
          exception,
        },
        exception.stack
      );

      response.status(statusCode).json({
        statusCode: statusCode,
        message: message,
      });
    } else {
      if (Array.isArray(exception?.response?.message)) {
        const totalErrors = exception.response.message.length;
        const firstErrorMessage = exception.response.message[0];
        const strippedErrorMessage =
          totalErrors > 1 ? `Error: ${firstErrorMessage} (1/${totalErrors})` : `Error: ${firstErrorMessage}`;
        exception.response.message = strippedErrorMessage;
      }

      next(exception);
    }
  }
}
