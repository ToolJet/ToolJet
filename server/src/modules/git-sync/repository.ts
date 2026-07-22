import { OrganizationGitSync } from '@entities/organization_git_sync.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';

@Injectable()
export class OrganizationGitSyncRepository extends Repository<OrganizationGitSync> {
  constructor(private dataSource: DataSource) {
    super(OrganizationGitSync, dataSource.createEntityManager());
  }

  async findOrgGitByOrganizationId(organizationId: string, manager?: EntityManager): Promise<OrganizationGitSync> {
    const repository = manager ? manager.getRepository(this.target) : this;
    return await repository.findOne({
      where: { organizationId: organizationId },
      relations: ['gitSsh', 'gitHttps', 'gitLab'],
    });
  }

  async findOrganizationGit(organizationGitId: string, organizationId: string, manager?: EntityManager) {
    const repository = manager ? manager.getRepository(this.target) : this;

    const orgGit = await repository.findOne({
      where: {
        id: organizationGitId,
        organizationId,
      },
    });
    return orgGit;
  }

  // Whether the org has git sync configured (and therefore every app in the org is considered git-synced).
  // Source of truth: presence of a default workspace branch row.
  async isOrganizationGitSynced(organizationId: string, manager?: EntityManager): Promise<boolean> {
    const repo = manager ? manager.getRepository(WorkspaceBranch) : this.dataSource.getRepository(WorkspaceBranch);
    const count = await repo.count({ where: { organizationId, isDefault: true } });
    return count > 0;
  }
}
