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
      relations: ['gitHttps', 'gitLab'],
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

  async findDefaultBranchId(organizationId: string, manager?: EntityManager): Promise<string | undefined> {
    const repo = manager ? manager.getRepository(WorkspaceBranch) : this.dataSource.getRepository(WorkspaceBranch);
    const defaultBranch = await repo.findOne({
      where: { organizationId, isDefault: true },
      select: ['id'],
    });
    return defaultBranch?.id;
  }
}
