import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { SSOConfigs, SSOType } from '@entities/sso_config.entity';
import { Organization } from '@entities/organization.entity';

@Injectable()
export class SSOConfigsRepository extends Repository<SSOConfigs> {
  async findByOrganizationId(organizationId: string): Promise<SSOConfigs[]> {
    return this.find({ where: { organizationId } });
  }

  async findInstanceConfigs(): Promise<SSOConfigs[]> {
    return this.find({ where: { organizationId: null } });
  }

  async createOrUpdateSSOConfig(configData: Partial<SSOConfigs>): Promise<SSOConfigs> {
    const existingConfig = await this.findOne({
      where: { sso: configData.sso, organizationId: configData.organizationId, configScope: configData.configScope },
    });

    if (existingConfig) {
      return this.save({ ...existingConfig, ...configData });
    }

    return this.save(this.create(configData));
  }

  async updateConfig(id: string, updateData: Partial<SSOConfigs>): Promise<SSOConfigs> {
    await this.update(id, updateData);
    return this.findOne({ where: { id } });
  }

  async deleteConfig(id: string): Promise<void> {
    await this.delete(id);
  }

  async getSSOConfigsForOrganization(organizationId: string, sso: SSOType | string): Promise<SSOConfigs | null> {
    return this.findOne({
      where: {
        organizationId,
        sso: sso as SSOType,
      },
      relations: ['organization'],
    });
  }
}
