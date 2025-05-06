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
import { OrganizationGitSync } from '@entities/organization_git_sync.entity';
import { IBaseGitSyncInterface } from './base-git.interface';
import { dbTransactionWrap } from '@helpers/database.helper';
import { EntityManager, Repository } from 'typeorm';
// import { SSHGitSyncUtilityService } from 'src/modules/git-sync/github-ssh/util.service';
import { BadRequestException } from '@nestjs/common';
// import { decamelizeKeys } from 'humps';
// import { LICENSE_FIELD } from '@licensing/helper';
import { AppGitPushDto } from '@modules/app-git/dto';
import { AppVersion } from '@entities/app_version.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { AppsService } from '@modules/apps/service';
import { ImportExportResourcesService } from '@modules/import-export-resources/service';
import { BaseGitUtilService } from './base-git-util.service';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
export abstract class BaseGitSyncService implements IBaseGitSyncInterface {
  constructor(
    @InjectRepository(OrganizationGitSync)
    protected organizationGitRepository: Repository<OrganizationGitSync>,
    @InjectRepository(AppVersion)
    protected appVersionsRepository: Repository<AppVersion>,
    protected importExportResourcesService: ImportExportResourcesService,
    protected appsService: AppsService,
    protected licenseTermsService: LicenseTermsService,
    protected readonly baseGitUtilService: BaseGitUtilService
  ) {}

  // While updating the status : change isEnabled and enum value of git_type
  // Updateing to TRUE -> isEnabled to true and git_type -> type provided from frontend
  // Updating to FALSE -> isEnabled to false
  async updateOrgGitStatus(
    organizationId: string,
    id: string,
    updateOrgGitDto: OrganizationGitStatusUpdateDto
  ): Promise<void> {
    const findOrgGit = await this.baseGitUtilService.findOrgGitByOrganizationId(organizationId);
    if (findOrgGit.gitType != updateOrgGitDto.gitType && findOrgGit.isEnabled) {
      if (updateOrgGitDto.isEnabled) {
        throw new BadRequestException('Only one Git provider can be active at a time.');
      }
      throw new BadRequestException('Git provider type mismatch');
    }
    return dbTransactionWrap(async (manager: EntityManager) => {
      await manager.findOneOrFail(OrganizationGitSync, { where: { organizationId, id } });
      await manager.update(OrganizationGitSync, { id }, updateOrgGitDto);
    });
  }
  async getAppVersionByVersionId(appGitPushBody: AppGitPushDto) {
    let versionId = appGitPushBody.versionId;
    let version = await this.appVersionsRepository.findOne({
      where: { id: versionId },
      relations: ['app'],
    });

    versionId = versionId == version.app.editingVersion.id ? versionId : version.app.editingVersion.id;
    version = await this.appVersionsRepository.findOne({
      where: { id: versionId },
      relations: ['app'],
    });
    if (!version) throw new BadRequestException('Wrong version Id');
    return version;
  }
  async getAppVersionById(versionId: string) {
    const version = await this.appVersionsRepository.findOne({
      where: { id: versionId },
      relations: ['app'],
    });
    if (!version) throw new BadRequestException('Wrong version Id');
    return version;
  }
}
