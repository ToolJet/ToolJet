import { Repository } from 'typeorm';
import { OrganizationGitSync } from '@entities/organization_git_sync.entity';

export class OrganizationGitSyncRepository extends Repository<OrganizationGitSync> {
  async findActiveByOrganization(organizationId: string): Promise<OrganizationGitSync | null> {
    return this.createQueryBuilder('orgGitSync')
      .where('orgGitSync.organizationId = :organizationId', { organizationId })
      .andWhere('orgGitSync.isEnabled = :isEnabled', { isEnabled: true })
      .leftJoinAndSelect('orgGitSync.appGitSync', 'appGitSync')
      .getOne();
  }

  async findByGitUrl(gitUrl: string): Promise<OrganizationGitSync | null> {
    return this.findOne({
      where: { gitUrl },
      relations: ['organization', 'appGitSync'],
    });
  }

  async createOrganizationGitSync(createParams: Partial<OrganizationGitSync>): Promise<OrganizationGitSync> {
    const newSync = this.create(createParams);
    return this.save(newSync);
  }

  async updateGitSyncStatus(organizationId: string, isEnabled: boolean): Promise<void> {
    await this.update({ organizationId }, { isEnabled });
  }

  async findWithRelations(id: string): Promise<OrganizationGitSync | null> {
    return this.findOne({
      where: { id },
      relations: ['organization', 'appGitSync'],
    });
  }
}
