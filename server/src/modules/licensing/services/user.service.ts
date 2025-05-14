import { dbTransactionWrap } from '@helpers/database.helper';
import { LIMIT_TYPE } from '@modules/users/constants/lifecycle';
import { generatePayloadForLimits } from '../helper';
import { EntityManager } from 'typeorm';
import { LicenseCountsService } from './count.service';
import { LICENSE_FIELD, LICENSE_LIMIT, LICENSE_LIMITS_LABEL } from '../constants';
import { HttpException, Injectable } from '@nestjs/common';
import { LicenseTermsService } from '../interfaces/IService';
import { ILicenseUserService } from '../interfaces/IService';

@Injectable()
export class LicenseUserService implements ILicenseUserService {
  constructor(
    protected readonly licenseTermsService: LicenseTermsService,
    protected readonly licenseCountsService: LicenseCountsService
  ) {}

  async getUserLimitsByType(type: LIMIT_TYPE): Promise<any> {
    const {
      allUsers: { total: users, editors: editorUsers, viewers: viewerUsers, superadmins: superadminUsers },
      status: licenseStatus,
    } = await this.licenseTermsService.getLicenseTerms([LICENSE_FIELD.USER, LICENSE_FIELD.STATUS]);

    return await dbTransactionWrap(async (manager: EntityManager) => {
      switch (type) {
        case LIMIT_TYPE.TOTAL: {
          if (users === LICENSE_LIMIT.UNLIMITED) {
            return;
          }
          const currentUsersCount = await this.licenseCountsService.getUsersCount(true, manager);
          return generatePayloadForLimits(currentUsersCount, users, licenseStatus);
        }
        case LIMIT_TYPE.EDITOR: {
          if (editorUsers === LICENSE_LIMIT.UNLIMITED) {
            return;
          }
          const currentEditorsCount = await this.licenseCountsService.fetchTotalEditorCount(manager);
          return generatePayloadForLimits(currentEditorsCount, editorUsers, licenseStatus);
        }
        case LIMIT_TYPE.VIEWER: {
          if (viewerUsers === LICENSE_LIMIT.UNLIMITED) {
            return;
          }
          const { viewer: currentViewersCount } = await this.licenseCountsService.fetchTotalViewerEditorCount(manager);
          return generatePayloadForLimits(currentViewersCount, viewerUsers, licenseStatus);
        }
        case LIMIT_TYPE.ALL: {
          const currentUsersCount = await this.licenseCountsService.getUsersCount(true, manager);
          const currentSuperadminsCount = await this.licenseCountsService.fetchTotalSuperadminCount(manager);
          const { viewer: currentViewersCount, editor: currentEditorsCount } =
            await this.licenseCountsService.fetchTotalViewerEditorCount(manager);

          return {
            usersCount: generatePayloadForLimits(currentUsersCount, users, licenseStatus, LICENSE_LIMITS_LABEL.USERS),
            editorsCount: generatePayloadForLimits(
              currentEditorsCount,
              editorUsers,
              licenseStatus,
              LICENSE_LIMITS_LABEL.EDIT_USERS
            ),
            viewersCount: generatePayloadForLimits(
              currentViewersCount,
              viewerUsers,
              licenseStatus,
              LICENSE_LIMITS_LABEL.END_USERS
            ),
            superadminsCount: generatePayloadForLimits(
              currentSuperadminsCount,
              superadminUsers,
              licenseStatus,
              LICENSE_LIMITS_LABEL.SUPERADMIN_USERS
            ),
          };
        }
      }
    });
  }

  async validateUser(manager: EntityManager): Promise<void> {
    let editor = -1,
      viewer = -1;
    const {
      total: users,
      editors: editorUsers,
      viewers: viewerUsers,
      superadmins: superadminUsers,
    } = await this.licenseTermsService.getLicenseTerms(LICENSE_FIELD.USER);

    if (superadminUsers !== LICENSE_LIMIT.UNLIMITED) {
      const superadmin = await this.licenseCountsService.fetchTotalSuperadminCount(manager);
      if (superadmin > superadminUsers) {
        throw new HttpException('You have reached your limit for number of super admins.', 451);
      }
    }

    if (users !== LICENSE_LIMIT.UNLIMITED && (await this.licenseCountsService.getUsersCount(true, manager)) > users) {
      throw new HttpException('You have reached your limit for number of users.', 451);
    }

    if (editorUsers !== LICENSE_LIMIT.UNLIMITED && viewerUsers !== LICENSE_LIMIT.UNLIMITED) {
      ({ editor, viewer } = await this.licenseCountsService.fetchTotalViewerEditorCount(manager));
    }
    if (editorUsers !== LICENSE_LIMIT.UNLIMITED) {
      if (editor === -1) {
        editor = await this.licenseCountsService.fetchTotalEditorCount(manager);
      }
      if (editor > editorUsers) {
        throw new HttpException('You have reached your limit for number of builders.', 451);
      }
    }

    if (viewerUsers !== LICENSE_LIMIT.UNLIMITED) {
      if (viewer === -1) {
        ({ viewer } = await this.licenseCountsService.fetchTotalViewerEditorCount(manager));
      }
      const addedUsers = await this.licenseCountsService.getUsersCount(true, manager);
      const addableUsers = users - addedUsers;

      if (viewer > viewerUsers && addableUsers < 0) {
        throw new HttpException('You have reached your limit for number of end users.', 451);
      }
    }
  }
}
