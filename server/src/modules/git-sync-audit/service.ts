import { Injectable } from '@nestjs/common';
import {
  GitSyncAuditAction,
  GitSyncAuditContext,
  GitSyncAuditDescribe,
  GitSyncAuditOutcome,
  GitSyncAuditOverride,
  GitSyncAuditRunOptions,
} from './types';

// Git Sync is an Enterprise feature; Community records nothing.
@Injectable()
export class GitSyncAuditService {
  async record<A extends GitSyncAuditAction>(
    _context: GitSyncAuditContext<A>,
    _outcome: GitSyncAuditOutcome<A>
  ): Promise<void> {}

  /** Runs the git operation and records how it ended. The operation's own result or error passes through. */
  async run<A extends GitSyncAuditAction, T>(
    _context: GitSyncAuditContext<A>,
    work: () => Promise<T>,
    _describe: GitSyncAuditDescribe<A, T>,
    _options?: GitSyncAuditRunOptions
  ): Promise<T> {
    return work();
  }

  /** Records the git operations `work` runs as automatic, e.g. a webhook importing a tag. */
  async asAutomatic<T>(_override: GitSyncAuditOverride, work: () => Promise<T>): Promise<T> {
    return work();
  }

  async findTagPush(
    _organizationId: string,
    _tagName: string,
    _tagSha: string | null
  ): Promise<{ operationId: string; branch: string | null } | null> {
    return null;
  }
}
