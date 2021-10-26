import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FolderApp } from '../../../src/entities/folder_app.entity';
import { Folder } from '../../entities/folder.entity';
import { FoldersController } from '../../controllers/folders.controller';
import { FoldersService } from '../../services/folders.service';
import { App } from 'src/entities/app.entity';
import { UsersService } from '@services/users.service';
import { User } from 'src/entities/user.entity';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { Organization } from 'src/entities/organization.entity';

@Module({
  controllers: [FoldersController],
  imports: [TypeOrmModule.forFeature([App, Folder, FolderApp, User, OrganizationUser, Organization])],
  providers: [FoldersService, UsersService],
})
export class FoldersModule {}
