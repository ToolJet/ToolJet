import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { SsoConfigOidcGroupSync } from '@entities/sso_config_oidc_group_sync.entity';

@Injectable()
export class SsoConfigOidcGroupSyncRepository extends Repository<SsoConfigOidcGroupSync> {
  constructor(private dataSource: DataSource) {
    super(SsoConfigOidcGroupSync, dataSource.createEntityManager());
  }

  async findBySsoConfigId(ssoConfigId: string): Promise<SsoConfigOidcGroupSync[]> {
    return this.find({ where: { ssoConfigId } });
  }

  async findByOrganizationId(organizationId: string): Promise<SsoConfigOidcGroupSync[]> {
    return this.find({ where: { organizationId } });
  }

  async createOrUpdateGroupSync(
    groupSyncArray: Partial<SsoConfigOidcGroupSync>[],
    ssoConfigId: string
  ): Promise<SsoConfigOidcGroupSync> {
    for (const groupSync of groupSyncArray) {
      const existingGroupSync = await this.findOne({
        where: {
          ssoConfigId,
          organizationId: groupSync.organizationId,
        },
      });
      if (existingGroupSync) {
        return this.save({ ...existingGroupSync, ...groupSync });
      }
      return this.save(this.create({ ...groupSync, ssoConfigId }));
    }
  }
}
