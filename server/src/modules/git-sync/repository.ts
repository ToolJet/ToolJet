import { OrganizationGitSync } from '@entities/organization_git_sync.entity';
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
}
