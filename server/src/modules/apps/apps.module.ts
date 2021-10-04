import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { App } from '../../entities/app.entity';
import { AppsController } from '../../controllers/apps.controller';
import { AppsService } from '../../services/apps.service';
import { AppVersion } from '../../../src/entities/app_version.entity';
import { DataQuery } from '../../../src/entities/data_query.entity';
import { CaslModule } from '../casl/casl.module';
import { AppUser } from 'src/entities/app_user.entity';
import { AppUsersService } from '@services/app_users.service';
import { AppUsersController } from '@controllers/app_users.controller';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { UsersService } from '@services/users.service';
import { User } from 'src/entities/user.entity';
import { Organization } from 'src/entities/organization.entity';
import { FoldersService } from '@services/folders.service';
import { Folder } from 'src/entities/folder.entity';
import { FolderApp } from 'src/entities/folder_app.entity';
import { DataSource } from 'src/entities/data_source.entity';
import { AppCloneService } from '@services/app_clone.service';
import { GroupPermission } from 'src/entities/group_permission.entity';
import { AppGroupPermission } from 'src/entities/app_group_permission.entity';
import { UserGroupPermission } from 'src/entities/user_group_permission.entity';
import { UserAppGroupPermission } from 'src/entities/user_app_group_permission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      App,
      AppVersion,
      AppUser,
      DataQuery,
      Folder,
      FolderApp,
      OrganizationUser,
      User,
      Organization,
      DataSource,
      GroupPermission,
      AppGroupPermission,
      UserGroupPermission,
      UserAppGroupPermission,
    ]),
    CaslModule,
  ],
  providers: [AppsService, AppUsersService, UsersService, FoldersService, AppCloneService],
  controllers: [AppsController, AppUsersController],
})
export class AppsModule {}
