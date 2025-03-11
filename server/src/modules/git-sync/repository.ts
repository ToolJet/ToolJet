import { DataSource, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { OrganizationGitSync } from '@entities/organization_git_sync.entity';
@Injectable()
export class OrganizationGitSyncRepository extends Repository<OrganizationGitSync> {
  constructor(private dataSource: DataSource) {
    super(OrganizationGitSync, dataSource.createEntityManager());
  }
  // need to check if it's required or not
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
    const newSync = this.manager.create(OrganizationGitSync, createParams);
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
