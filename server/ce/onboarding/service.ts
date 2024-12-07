import { Injectable } from '@nestjs/common';
import { UsersService } from '@services/users.service';
import { AuthService } from '@services/auth.service';
import { OrganizationsService } from '@services/organizations.service';
import { CreateAdminDto } from '@dto/user.dto';
import { Response } from 'express';
import { generateWorkspaceSlug } from '@helpers/utils.helper';
import { dbTransactionWrap } from '@helpers/database.helper';
import { OrganizationUsersService } from '@services/organization_users.service';
import { MetadataService } from '@services/metadata.service';
import { USER_STATUS } from '@helpers/user_lifecycle';
import { USER_ROLE } from '@modules/user_resource_permissions/constants/group-permissions.constant';

@Injectable()
export class OnboardingService {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
    private organizationsService: OrganizationsService,
    private organizationUsersService: OrganizationUsersService,
    private metadataService: MetadataService
  ) {}

  async setupFirstUser(response: Response, userCreateDto: CreateAdminDto): Promise<any> {
    const { name, workspaceName, password, email, region } = userCreateDto;
    const workspaceSlug = generateWorkspaceSlug(workspaceName || 'My workspace');

    const result = await dbTransactionWrap(async (manager) => {
      const organization = await this.organizationsService.create(
        workspaceName || 'My workspace',
        workspaceSlug,
        null,
        manager
      );
      const user = await this.usersService.create(
        {
          email,
          password,
          firstName: name.split(' ')[0],
          lastName: name.split(' ').slice(1).join(' '),
          status: USER_STATUS.ACTIVE,
        },
        organization.id,
        USER_ROLE.ADMIN,
        null,
        false,
        null,
        manager
      );

      await this.organizationUsersService.create(user, organization, false, manager);
      return this.authService.generateLoginResultPayload(response, user, organization, false, true, null, manager);
    });

    await this.metadataService.finishOnboardingCE(name, email, workspaceName, region);
    return result;
  }
}
