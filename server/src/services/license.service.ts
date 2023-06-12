import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { InstanceSettingsService } from './instance_settings.service';
import { LICENSE_FIELD, decrypt } from 'src/helpers/license.helper';
import License from '@ee/licensing/configs/License';
import { LicenseUpdateDto } from '@dto/license.dto';
import { InstanceSettings } from 'src/entities/instance_settings.entity';
import { InstanceSettingsType } from 'src/helpers/instance_settings.constants';

@Injectable()
export class LicenseService {
  constructor(private instanceSettingsService: InstanceSettingsService) {}

  async getLicenseTerms(type: LICENSE_FIELD): Promise<any> {
    await this.init();

    if (!(License.Instance() && License.Instance().isValid)) {
      throw new HttpException('License violation - Invalid license', 451);
    }
    switch (type) {
      case LICENSE_FIELD.ALL:
        return License.Instance().terms;

      case LICENSE_FIELD.APP_COUNT:
        return License.Instance().apps;

      case LICENSE_FIELD.TOTAL_USERS:
        return License.Instance().users;

      case LICENSE_FIELD.EDITORS:
        return License.Instance().editorUsers;

      case LICENSE_FIELD.VIEWERS:
        return License.Instance().viewerUsers;

      case LICENSE_FIELD.IS_EXPIRED:
        return License.Instance().isExpired;

      case LICENSE_FIELD.OIDC:
        return License.Instance().oidc;

      case LICENSE_FIELD.AUDIT_LOGS:
        return License.Instance().auditLog;

      case LICENSE_FIELD.VALID:
        return License.Instance().isValid && !License.Instance().isExpired;

      case LICENSE_FIELD.USER:
        return {
          total: License.Instance().users,
          editors: License.Instance().editorUsers,
          viewers: License.Instance().viewerUsers,
        };

      default:
        return License.Instance().terms;
    }
  }

  async init(): Promise<void> {
    const licenseSetting: InstanceSettings = await this.instanceSettingsService.getSettings(
      'LICENSE_KEY',
      InstanceSettingsType.SYSTEM
    );
    const updatedAt = await License.Instance()?.updatedAt;
    const isUpdated: boolean = updatedAt?.getTime() !== new Date(licenseSetting.updatedAt).getTime();

    if (!updatedAt || isUpdated) {
      // No License updated or new license available
      License.Reload(licenseSetting?.value, licenseSetting?.updatedAt);
    }
  }

  async getLicense(): Promise<InstanceSettings> {
    return await this.instanceSettingsService.getSettings('LICENSE_KEY', InstanceSettingsType.SYSTEM);
  }

  async updateLicense(dto: LicenseUpdateDto): Promise<void> {
    const licenseSetting: InstanceSettings = await this.instanceSettingsService.getSettings(
      'LICENSE_KEY',
      InstanceSettingsType.SYSTEM
    );
    try {
      decrypt(dto.key);
      await this.instanceSettingsService.update([{ id: licenseSetting.id, value: dto.key }]);
    } catch (e) {
      throw new BadRequestException('License key is invalid');
    }
  }
}
