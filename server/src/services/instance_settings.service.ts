import { CreateInstanceSettingsDto } from '@dto/create_instance_settings.dto';
import { BASIC_PLAN_SETTINGS } from '@ee/licensing/configs/PlanTerms';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InstanceSettings } from 'src/entities/instance_settings.entity';
import { InstanceSettingsType } from 'src/helpers/instance_settings.constants';
import { dbTransactionWrap } from 'src/helpers/utils.helper';
import { EntityManager, In, Repository } from 'typeorm';
import { LicenseService } from './license.service';
import { LICENSE_FIELD } from 'src/helpers/license.helper';

@Injectable()
export class InstanceSettingsService {
  constructor(
    @InjectRepository(InstanceSettings)
    private instanceSettingsRepository: Repository<InstanceSettings>,
    private licenseService: LicenseService
  ) {}

  async getSettings(
    key?: string | string[],
    getAllData = false,
    type?: InstanceSettingsType.USER | InstanceSettingsType.SYSTEM
  ): Promise<any> {
    let isLicenseValid = true;

    const settings = await this.instanceSettingsRepository.find({
      where: { ...(key && key.length && { key: Array.isArray(key) ? In(key) : key }), ...(type && { type }) },
    });

    if ((Array.isArray(key) ? key : [key]).some((e) => Object.keys(BASIC_PLAN_SETTINGS).includes(e))) {
      isLicenseValid = await this.licenseService.getLicenseTerms(LICENSE_FIELD.VALID);
    }

    const instanceConfigs = {};
    settings?.forEach((config) => {
      if (!isLicenseValid && Object.keys(BASIC_PLAN_SETTINGS).includes(config.key)) {
        instanceConfigs[config.key] = getAllData
          ? { ...config, value: BASIC_PLAN_SETTINGS[config.key], isDisabled: true }
          : BASIC_PLAN_SETTINGS[config.key];
      } else {
        instanceConfigs[config.key] = getAllData ? config : config.value;
      }
    });

    return Array.isArray(key) ? instanceConfigs : instanceConfigs[key];
  }

  async listSettings(type = InstanceSettingsType.USER): Promise<any> {
    return Object.values(await this.getSettings([], true, type));
  }

  async create(params: CreateInstanceSettingsDto) {
    return await this.instanceSettingsRepository.save(
      this.instanceSettingsRepository.create({
        key: params.key,
        labelKey: params.labelKey,
        label: params.label,
        value: params.value,
        helperText: params.helperText,
        helperTextKey: params.helperTextKey,
        dataType: params.dataType,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );
  }

  async updateParams(params: any) {
    await dbTransactionWrap(async (manager: EntityManager) => {
      await Promise.all(
        params.map(async (param) => {
          const isLicenseValid = await this.licenseService.getLicenseTerms(LICENSE_FIELD.VALID);
          if (!isLicenseValid) {
            const configKey = (await manager.findOneOrFail(InstanceSettings, { id: param.id })).key;
            if (!Object.keys(BASIC_PLAN_SETTINGS).includes(configKey)) {
              await this.update(param, manager);
            }
          } else {
            await this.update(param, manager);
          }
        })
      );
    });
  }

  private async update(param, manager: EntityManager) {
    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.update(
        InstanceSettings,
        {
          id: param.id,
        },
        { value: param.value }
      );
    }, manager);
  }

  async delete(settings_id: string) {
    return await this.instanceSettingsRepository.delete(settings_id);
  }
}
