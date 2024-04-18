import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

@Catch()
export class TooljetDbExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const next = ctx.getNext();
    const response = ctx.getResponse();

    if (exception instanceof QueryFailedError) {
      const statusCode = HttpStatus.CONFLICT;
      const message = (exception as QueryFailedError).message;

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
