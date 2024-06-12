import { Injectable, CanActivate, ExecutionContext, HttpException } from '@nestjs/common';
import { getManager } from 'typeorm';
import { LICENSE_FIELD, LICENSE_LIMIT } from 'src/helpers/license.helper';
import { OrganizationLicenseService } from '@services/organization_license.service';
import { LicenseService } from '@services/license.service';
import { InstanceSettingsService } from '@services/instance_settings.service';
import { INSTANCE_USER_SETTINGS } from 'src/helpers/instance_settings.constants';

@Injectable()
export class EditorUserCountGuard implements CanActivate {
  constructor(
    private instanceSettingsService: InstanceSettingsService,
    private licenseService: LicenseService,
    private OrgLicenseService: OrganizationLicenseService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const isWorkspaceSignup = !!request.body.organizationId;
    const isPersonalWorkspaceEnabled =
      (await this.instanceSettingsService.getSettings(INSTANCE_USER_SETTINGS.ALLOW_PERSONAL_WORKSPACE)) === 'true';
    if (isWorkspaceSignup && !isPersonalWorkspaceEnabled) return true;

    const organizationId = request.headers['tj-workspace-id'];
    const editorsCount = await this.licenseService.getLicenseTerms(LICENSE_FIELD.EDITORS, organizationId);
    if (editorsCount === LICENSE_LIMIT.UNLIMITED) {
      return true;
    }
    const editorCount = await this.OrgLicenseService.fetchTotalEditorCount(getManager());

    if (editorCount >= editorsCount) {
      throw new HttpException('Maximum editor user limit reached', 451);
    }
    return true;
  }
}
