import { CreateInstanceSettingsDto, UpdateInstanceSettingsDto } from '@dto/create_instance_settings.dto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InstanceSettings } from 'src/entities/instance_settings.entity';
import { Repository } from 'typeorm';
import { cleanObject } from 'src/helpers/utils.helper';

@Injectable()
export class InstanceSettingsService {
  constructor(
    @InjectRepository(InstanceSettings)
    private intanceSettingsRepository: Repository<InstanceSettings>
  ) {}

  async getSettings() {
    return await this.intanceSettingsRepository.find();
  }

  async create(params: CreateInstanceSettingsDto) {
    return await this.intanceSettingsRepository.save(
      this.intanceSettingsRepository.create({
        key: params.key,
        value: params.value,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );
  }

  async update(settings_id: string, params: UpdateInstanceSettingsDto) {
    const { key, value } = params;
    const updateableParams = {
      key,
      value,
    };

    // removing keys with undefined values
    cleanObject(updateableParams);

    return await this.intanceSettingsRepository.update(
      {
        id: settings_id,
      },
      updateableParams
    );
  }

  async delete(settings_id: string) {
    return await this.intanceSettingsRepository.delete(settings_id);
  }
}
