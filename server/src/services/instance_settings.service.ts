import { CreateInstanceSettingsDto } from '@dto/create_instance_settings.dto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InstanceSettings } from 'src/entities/instance_settings.entity';
import { InstanceSettingsType } from 'src/helpers/instance_settings.constants';
import { dbTransactionWrap } from 'src/helpers/utils.helper';
import { EntityManager, In, Repository } from 'typeorm';

@Injectable()
export class InstanceSettingsService {
  constructor(
    @InjectRepository(InstanceSettings)
    private instanceSettingsRepository: Repository<InstanceSettings>
  ) {}

  async getSettings(key?: string | string[], type?: string): Promise<any> {
    const settings = await this.instanceSettingsRepository.find(
      key ? { where: { key: Array.isArray(key) ? In(key) : key, type: type ?? InstanceSettingsType.USER } } : {}
    );

    const instanceConfigs = {};
    settings?.forEach((config) => {
      instanceConfigs[config.key] = config.type === InstanceSettingsType.SYSTEM ? config : config.value;
    });

    return Array.isArray(key) ? instanceConfigs : instanceConfigs[key];
  }

  async listSettings(type = InstanceSettingsType.USER) {
    return await this.instanceSettingsRepository.find({ where: { type } });
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

  async update(params: any) {
    await dbTransactionWrap(async (manager: EntityManager) => {
      params.map(async (param) => {
        await manager.update(
          InstanceSettings,
          {
            id: param.id,
          },
          { value: param.value }
        );
      });
    });
  }

  async delete(settings_id: string) {
    return await this.instanceSettingsRepository.delete(settings_id);
  }
}
