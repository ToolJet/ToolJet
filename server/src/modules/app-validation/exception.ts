import { BadRequestException } from '@nestjs/common';
import { APP_VALIDATION_FAILED } from './constants';
import { Issue } from './types';

export class AppValidationException extends BadRequestException {
  // Read by AllExceptionsFilter as the response `code`.
  readonly code = APP_VALIDATION_FAILED;

  constructor(
    readonly issues: Issue[],
    readonly warnings: Issue[] = [],
    area?: string
  ) {
    super({ message: summarize(issues, area), code: APP_VALIDATION_FAILED, issues, warnings });
  }
}

function summarize(issues: Issue[], area?: string): string {
  const where = area ? ` in ${area}` : '';
  const count = `${issues.length} validation ${issues.length === 1 ? 'problem' : 'problems'}${where}`;
  return issues.length ? `${count}: ${issues[0].message}` : count;
}
