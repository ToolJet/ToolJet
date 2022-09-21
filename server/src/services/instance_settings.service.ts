import { CreateInstanceSettingsDto } from '@dto/create_instance_settings.dto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InstanceSettings } from 'src/entities/instance_settings.entity';
import { In, Repository } from 'typeorm';

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

  async listSettings() {
    return await this.instanceSettingsRepository.find();
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

  async update(params: any) {
    const { allow_personal_workspace, allow_plugin_integration } = params;
    const updatableArray = [
      allow_personal_workspace && { id: allow_personal_workspace.id, value: allow_personal_workspace.value },
      allow_plugin_integration && { id: allow_plugin_integration.id, value: allow_plugin_integration.value },
    ];

    return await Promise.all(
      updatableArray.map(async (item) => {
        await this.instanceSettingsRepository.update(
          {
            id: item.id,
          },
          { value: item.value }
        );
      })
    );
  }

  async delete(settings_id: string) {
    return await this.instanceSettingsRepository.delete(settings_id);
  }
}
