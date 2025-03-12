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
  NotAcceptableException,
  Put,
  Get,
  Query,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { OrganizationUsersService } from '@modules/organization-users/service';
import { JwtAuthGuard } from '../session/guards/jwt-auth.guard';
import { User as UserEntity } from 'src/entities/user.entity';
import { User } from '@modules/app/decorators/user.decorator';
import { InviteNewUserDto } from '@modules/organization-users/dto/invite-new-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { decamelizeKeys } from 'humps';
import { FeatureAbilityGuard } from './ability/guard';
import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from './constants';
import { Response } from 'express';
import { IOrganizationUsersController } from './interfaces/IController';
import { UpdateOrgUserDto } from './dto';

const MAX_CSV_FILE_SIZE = 1024 * 1024 * 1; // 1MB
@Controller('organization-users')
@InitModule(MODULES.ORGANIZATION_USER)
@UseGuards(JwtAuthGuard, FeatureAbilityGuard)
export class OrganizationUsersController implements IOrganizationUsersController {
  constructor(protected organizationUsersService: OrganizationUsersService) {}

  @InitFeature(FEATURE_KEY.SUGGEST_USERS)
  @Get('users/suggest')
  async getUserSuggestions(@User() user, @Query('input') searchInput) {
    const users = await this.organizationUsersService.fetchUsersByValue(user?.organization_id, searchInput);
    const response = {
      users,
    };

    return decamelizeKeys(response);
  }
  // Endpoint for inviting new organization users
  @InitFeature(FEATURE_KEY.USER_INVITE)
  @Post()
  async create(@User() user, @Body() inviteNewUserDto: InviteNewUserDto) {
    await this.organizationUsersService.inviteNewUser(user, inviteNewUserDto);
    return;
  }

  @InitFeature(FEATURE_KEY.USER_BULK_UPLOAD)
  @UseInterceptors(FileInterceptor('file'))
  @Post('upload-csv')
  async bulkUploadUsers(
    @User() user: UserEntity,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: MAX_CSV_FILE_SIZE })],
      })
    )
    file: any,
    @Res() res: Response
  ) {
    if (file?.size > MAX_CSV_FILE_SIZE) {
      throw new BadRequestException('File size cannot be greater than 2MB');
    }
    await this.organizationUsersService.bulkUploadUsers(user, file?.buffer, res);
    return;
  }

  @InitFeature(FEATURE_KEY.USER_ARCHIVE)
  @Post(':id/archive')
  async archive(@User() user: UserEntity, @Param('id') id: string) {
    const organizationId = user.organizationId;
    await this.organizationUsersService.archive(id, organizationId, user);
    return;
  }

  @InitFeature(FEATURE_KEY.USER_ARCHIVE_ALL)
  @Post(':userId/archive-all')
  async archiveAll(@User() user: UserEntity, @Param('userId') userId: string) {
    if (user.id === userId) {
      throw new NotAcceptableException('Self archive not allowed');
    }
    await this.organizationUsersService.archiveFromAll(userId);
    return;
  }

  @InitFeature(FEATURE_KEY.USER_UNARCHIVE_ALL)
  @Post(':userId/unarchive-all')
  async unarchiveAll(@User() user: UserEntity, @Param('userId') userId: string) {
    await this.organizationUsersService.unarchiveUser(userId);
    return;
  }

  @InitFeature(FEATURE_KEY.USER_UPDATE)
  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateOrgUserDto, @User() user: UserEntity) {
    await this.organizationUsersService.updateOrgUser(id, user, updateUserDto);
    return;
  }

  @InitFeature(FEATURE_KEY.USER_UNARCHIVE)
  @Post(':id/unarchive')
  async unarchive(@User() user, @Param('id') id: string, @Body() body) {
    const organizationId = body.organizationId ? body.organizationId : user.organizationId;
    await this.organizationUsersService.unarchive(user, id, organizationId);
    return;
  }

  @InitFeature(FEATURE_KEY.VIEW_ALL_USERS)
  @Get()
  async getUsers(@User() user, @Query() query) {
    const response = await this.organizationUsersService.getUsers(user, query);
    return decamelizeKeys(response);
  }
}
