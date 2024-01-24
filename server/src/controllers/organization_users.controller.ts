import {
  Controller,
  Param,
  Post,
  UseGuards,
  Body,
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
  Put,
} from '@nestjs/common';
import { Response, Express } from 'express';
import { OrganizationUsersService } from 'src/services/organization_users.service';
import { decamelizeKeys } from 'humps';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { AppAbility } from 'src/modules/casl/casl-ability.factory';
import { PoliciesGuard } from 'src/modules/casl/policies.guard';
import { CheckPolicies } from 'src/modules/casl/check_policies.decorator';
import { User as UserEntity } from 'src/entities/user.entity';
import { User } from 'src/decorators/user.decorator';
import { InviteNewUserDto } from '../dto/invite-new-user.dto';
import { OrganizationsService } from '@services/organizations.service';
import { FileInterceptor } from '@nestjs/platform-express';

const MAX_CSV_FILE_SIZE = 1024 * 1024 * 1; // 1MB
@Controller('organization_users')
export class OrganizationUsersController {
  constructor(
    private organizationUsersService: OrganizationUsersService,
    private organizationsService: OrganizationsService
  ) {}

  // Endpoint for inviting new organization users
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('inviteUser', UserEntity))
  @Post()
  async create(@User() user, @Body() inviteNewUserDto: InviteNewUserDto) {
    await this.organizationsService.inviteNewUser(user, inviteNewUserDto);
    return;
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('inviteUser', UserEntity))
  @UseInterceptors(FileInterceptor('file'))
  @Post('upload_csv')
  async bulkUploadUsers(@User() user, @UploadedFile() file: Express.Multer.File, @Res() res: Response) {
    if (file.size > MAX_CSV_FILE_SIZE) {
      throw new BadRequestException('File size cannot be greater than 2MB');
    }
    await this.organizationsService.bulkUploadUsers(user, file.buffer, res);
    return;
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('archiveUser', UserEntity))
  @Post(':id/archive')
  async archive(@User() user, @Param('id') id: string) {
    await this.organizationUsersService.archive(id, user.organizationId);
    return;
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('updateUser', UserEntity))
  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() updateUserDto) {
    await this.organizationUsersService.updateOrgUser(id, updateUserDto);
    return;
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('archiveUser', UserEntity))
  @Post(':id/unarchive')
  async unarchive(@User() user, @Param('id') id: string) {
    await this.organizationUsersService.unarchive(user, id);
    return;
  }

  // Deprecated
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('changeRole', UserEntity))
  @Post(':id/change_role')
  async changeRole(@Param('id') id, @Body('role') role) {
    const result = await this.organizationUsersService.changeRole(id, role);
    return decamelizeKeys({ result });
  }
}
