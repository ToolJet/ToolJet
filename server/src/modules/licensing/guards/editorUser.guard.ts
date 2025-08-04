import { Injectable, CanActivate, ExecutionContext, HttpException } from '@nestjs/common';
import { LicenseCountsService } from '@modules/licensing/services/count.service';
import { LICENSE_FIELD, LICENSE_LIMIT, ORGANIZATION_INSTANCE_KEY } from '@modules/licensing/constants';
import { DataSource } from 'typeorm';
import { LicenseTermsService } from '../interfaces/IService';
import { InstanceSettingsUtilService } from '@modules/instance-settings/util.service';
import { INSTANCE_USER_SETTINGS } from '@modules/instance-settings/constants';
import { getTooljetEdition } from '@helpers/utils.helper';
import { TOOLJET_EDITIONS } from '@modules/app/constants';

@Injectable()
export class EditorUserCountGuard implements CanActivate {
  constructor(
    protected instanceSettingsUtilService: InstanceSettingsUtilService,
    protected licenseTermsService: LicenseTermsService,
    protected licenseCountsService: LicenseCountsService,
    protected readonly _dataSource: DataSource
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const organizationId = request.body.organizationId;
    const isWorkspaceSignup = !!organizationId;
    if (isWorkspaceSignup && getTooljetEdition() === TOOLJET_EDITIONS.Cloud) {
      // Not needed for cloud edition, as it is not used in the cloud
      return true;
    }
    const isPersonalWorkspaceEnabled =
      (await this.instanceSettingsUtilService.getSettings(INSTANCE_USER_SETTINGS.ALLOW_PERSONAL_WORKSPACE)) === 'true';
    if (isWorkspaceSignup && !isPersonalWorkspaceEnabled) return true;

    const editorsCount = await this.licenseTermsService.getLicenseTermsInstance(LICENSE_FIELD.EDITORS);
    if (editorsCount === LICENSE_LIMIT.UNLIMITED) {
      return true;
    }
    const editorCount = await this.licenseCountsService.fetchTotalEditorCount(
      organizationId || ORGANIZATION_INSTANCE_KEY,
      this._dataSource.manager
    );

    if (editorCount >= editorsCount) {
      throw new HttpException('Maximum editor user limit reached', 451);
    }
    return true;
  }
}
