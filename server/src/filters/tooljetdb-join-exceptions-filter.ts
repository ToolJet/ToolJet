import { Catch, ArgumentsHost, ExceptionFilter, BadRequestException } from '@nestjs/common';

@Catch(BadRequestException)
export class TooljetDbJoinExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const next = host.switchToHttp().getNext();

    if (Array.isArray(exception.response.message)) {
      const totalErrors = exception.response.message.length;
      const firstErrorMessage = exception.response.message[0];
      const strippedErrorMessage = `Error: ${firstErrorMessage} (1/${totalErrors})`;
      exception.response.message = strippedErrorMessage;
    }

    next(exception);
  }
}
