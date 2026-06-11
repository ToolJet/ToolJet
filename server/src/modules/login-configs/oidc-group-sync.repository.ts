import { Injectable } from '@nestjs/common';
import { DataSource, In, Not, Repository } from 'typeorm';
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
  ): Promise<SsoConfigOidcGroupSync[]> {
    const results = [];
    for (const groupSync of groupSyncArray) {
      // remove id if it exists to avoid conflict
      delete groupSync.id;
      const existingGroupSync = await this.findOne({
        where: {
          ssoConfigId,
          organizationId: groupSync.organizationId,
        },
      });
      if (existingGroupSync) {
        results.push(await this.save({ ...existingGroupSync, ...groupSync }));
      } else {
        results.push(await this.save(this.create({ ...groupSync, ssoConfigId })));
      }
    }

    if (groupSyncArray.length > 0) {
      const organizationIds = groupSyncArray.map((groupSync) => groupSync.organizationId);
      // Delete all entries for this ssoConfigId whose organizationId is NOT in the current groupSyncArray
      const groupSyncsToDelete = await this.find({
        where: {
          ssoConfigId,
          organizationId: Not(In(organizationIds)),
        },
      });
      if (groupSyncsToDelete.length > 0) {
        await this.remove(groupSyncsToDelete);
        results.push(...groupSyncsToDelete);
      }
    }

    return results;
  }
}
