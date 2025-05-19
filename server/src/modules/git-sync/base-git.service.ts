/**
 * Base service for all source control implementations to share common Git synchronization methods.
 *
 * @remarks
 * DEPENDENCY INJECTION CONSTRAINT: Only platform-common services can be injected here
 * (Licensing, Import/Export, etc.).
 * Provider-specific implementations (SSH/HTTPS GitHub,
 * GitLab, etc.) must be injected at the concrete service level, not in this base class.
 *
 * METHOD CONSTRAINT: Only methods that are identical across all source control providers
 * should be implemented in this base class. Provider-specific logic should be moved to
 * the respective concrete implementations.
 */

import { OrganizationGitStatusUpdateDto } from '@dto/organization_git.dto';
import { IBaseGitSyncInterface } from './base-git.interface';
import { AppGitPushDto } from '@modules/app-git/dto';
import { AppVersion } from '@entities/app_version.entity';

export abstract class BaseGitSyncService implements IBaseGitSyncInterface {
  constructor() {}

  async updateOrgGitStatus(
    organizationId: string,
    id: string,
    updateOrgGitDto: OrganizationGitStatusUpdateDto
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async getAppVersionByVersionId(appGitPushBody: AppGitPushDto): Promise<AppVersion> {
    throw new Error('Method not implemented.');
  }

  async getAppVersionById(versionId: string): Promise<AppVersion> {
    throw new Error('Method not implemented.');
  }
}
