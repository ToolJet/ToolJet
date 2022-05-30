import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FolderApp } from '../../../src/entities/folder_app.entity';
import { Folder } from '../../entities/folder.entity';
import { FoldersController } from '../../controllers/folders.controller';
import { FoldersService } from '../../services/folders.service';
import { App } from 'src/entities/app.entity';
import { File } from 'src/entities/file.entity';
import { UsersService } from '@services/users.service';
import { FilesService } from '@services/files.service';
import { User } from 'src/entities/user.entity';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { Organization } from 'src/entities/organization.entity';
import { CaslModule } from '../casl/casl.module';

@Module({
  controllers: [FoldersController],
  imports: [TypeOrmModule.forFeature([App, File, Folder, FolderApp, User, OrganizationUser, Organization]), CaslModule],
  providers: [FilesService, FoldersService, UsersService],
})
export class FoldersModule {}
