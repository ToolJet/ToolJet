import { CreateInstanceSettingsDto } from '@dto/create_instance_settings.dto';
import { BASIC_PLAN_SETTINGS } from '@ee/licensing/configs/PlanTerms';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InstanceSettings } from 'src/entities/instance_settings.entity';
import { InstanceSettingsType } from 'src/helpers/instance_settings.constants';
import { LICENSE_FIELD } from 'src/helpers/license.helper';
import { dbTransactionWrap } from 'src/helpers/utils.helper';
import { EntityManager, In, Repository } from 'typeorm';
import { LicenseService } from './license.service';

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
    let licenseTerms;

    const settings = await this.instanceSettingsRepository.find({
      where: { ...(key && key.length && { key: Array.isArray(key) ? In(key) : key }), ...(type && { type }) },
      order: { createdAt: 'ASC' },
    });

    if (settings.some((e) => Object.keys(BASIC_PLAN_SETTINGS).includes(e.key))) {
      isLicenseValid = await this.licenseService.getLicenseTerms(LICENSE_FIELD.VALID);
    }

    const settingsWithLicenseFeature = settings.filter((e) =>
      Object.keys(BASIC_PLAN_SETTINGS)
        .filter((settings) => !!BASIC_PLAN_SETTINGS[settings].feature)
        .includes(e.key)
    );

    if (settingsWithLicenseFeature && settingsWithLicenseFeature.length) {
      // need to control some settings based on feature
      licenseTerms = await this.licenseService.getLicenseTerms(
        settingsWithLicenseFeature.map((s) => BASIC_PLAN_SETTINGS[s.key].feature)
      );
    }

    const instanceConfigs = {};
    settings?.forEach((config) => {
      let value;
      if (!isLicenseValid && Object.keys(BASIC_PLAN_SETTINGS).includes(config.key)) {
        value = BASIC_PLAN_SETTINGS?.[config.key]?.value;
      } else {
        value = this.getSettingsValue(settingsWithLicenseFeature, config, licenseTerms);
      }
      instanceConfigs[config.key] = getAllData ? { ...config, value, isDisabled: true } : value;
    });

    const res = Array.isArray(key) ? instanceConfigs : instanceConfigs[key];
    return res;
  }

  private getSettingsValue(
    settingsWithLicenseFeature: Array<InstanceSettings>,
    currentConfigs: InstanceSettings,
    licenseTerms: any
  ): any {
    if (!(currentConfigs.key in BASIC_PLAN_SETTINGS)) {
      return currentConfigs.value;
    }
    return settingsWithLicenseFeature.map((e) => e.key).includes(currentConfigs.key) &&
      licenseTerms[BASIC_PLAN_SETTINGS[currentConfigs.key].feature]
      ? currentConfigs.value
      : BASIC_PLAN_SETTINGS[currentConfigs.key].value;
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
    // Only Instance settings of USER type can edited using this function
    await dbTransactionWrap(async (manager: EntityManager) => {
      await Promise.all(
        params.map(async (param) => {
          const isLicenseValid = await this.licenseService.getLicenseTerms(LICENSE_FIELD.VALID);
          const config = await manager.findOneOrFail(InstanceSettings, {
            id: param.id,
            type: InstanceSettingsType.USER,
          });
          if (!isLicenseValid) {
            if (!Object.keys(BASIC_PLAN_SETTINGS).includes(config.key)) {
              await this.update(param, manager);
            }
          } else {
            await this.update(param, manager);
          }
        })
      );
    });
  }

  async updateSystemParams(params: any) {
    // Only Instance settings of SYSTEM type can edited using this function
    const keysToUpdate = Object.keys(params);
    await dbTransactionWrap(async (manager: EntityManager) => {
      for (const key of keysToUpdate) {
        const config = await manager.findOneOrFail(InstanceSettings, {
          key,
          type: InstanceSettingsType.SYSTEM,
        });
        config.value = params[key];
        await manager.save(InstanceSettings, config);
      }
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
