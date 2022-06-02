import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from '../../services/users.service';
import { OrganizationUser } from '../../entities/organization_user.entity';
import { Organization } from '../../entities/organization.entity';
import { User } from '../../entities/user.entity';
import { File } from '../../entities/file.entity';
import { UsersController } from 'src/controllers/users.controller';
import { OrganizationsModule } from '../organizations/organizations.module';
import { App } from 'src/entities/app.entity';
import { FilesService } from '@services/files.service';

@Module({
  imports: [OrganizationsModule, TypeOrmModule.forFeature([User, File, Organization, OrganizationUser, App])],
  providers: [UsersService, FilesService],
  controllers: [UsersController],
})
export class UsersModule {}
