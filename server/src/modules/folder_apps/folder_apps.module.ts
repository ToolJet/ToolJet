import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Folder } from '../../../src/entities/folder.entity';
import { FolderApp } from '../../../src/entities/folder_app.entity';
import { FolderAppsController } from '../../controllers/folder_apps.controller';
import { FolderAppsService } from '../../services/folder_apps.service';

@Module({
  controllers: [FolderAppsController],
  imports: [TypeOrmModule.forFeature([Folder, FolderApp])],
  providers: [FolderAppsService],
})
export class FolderAppsModule {}
