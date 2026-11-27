import { ConflictException } from '@nestjs/common';

export class LibraryQueryInUseException extends ConflictException {
  // AllExceptionsFilter reads the exception's code, not just its response body.
  readonly code = 'LIBRARY_QUERY_IN_USE';

  constructor(message: string) {
    super({ code: 'LIBRARY_QUERY_IN_USE', message });
  }
}
