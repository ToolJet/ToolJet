import { CreateInstanceSettingsDto, UpdateInstanceSettingsDto } from '@dto/create_instance_settings.dto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InstanceSettings } from 'src/entities/instance_settings.entity';
import { In, Repository } from 'typeorm';
import { cleanObject } from 'src/helpers/utils.helper';

@Injectable()
export class InstanceSettingsService {
  constructor(
    @InjectRepository(InstanceSettings)
    private instanceSettingsRepository: Repository<InstanceSettings>
  ) {}

  async getSettings(key?: string | string[]) {
    const settings = await this.instanceSettingsRepository.find(
      key ? { where: { key: Array.isArray(key) ? In(key) : key } } : {}
    );

    const instanceConfigs = {};
    settings?.forEach((config) => {
      instanceConfigs[config.key] = config.value;
    });

    return Array.isArray(key) ? instanceConfigs : instanceConfigs[key];
  }

  async create(params: CreateInstanceSettingsDto) {
    return await this.instanceSettingsRepository.save(
      this.instanceSettingsRepository.create({
        key: params.key,
        value: params.value,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );
  }

  async update(settings_id: string, params: UpdateInstanceSettingsDto) {
    const { key, value } = params;
    const updatableParams = {
      key,
      value,
    };

    // removing keys with undefined values
    cleanObject(updatableParams);

    return await this.instanceSettingsRepository.update(
      {
        id: settings_id,
      },
      updatableParams
    );
  }

  async delete(settings_id: string) {
    return await this.instanceSettingsRepository.delete(settings_id);
  }
}
