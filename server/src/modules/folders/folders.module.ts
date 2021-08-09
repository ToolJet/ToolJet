import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FolderApp } from '../../../src/entities/folder_app.entity';
import { Folder } from '../../entities/folder.entity';
import { FoldersController } from '../../controllers/folders.controller';
import { FoldersService } from '../../services/folders.service';
import { App } from 'src/entities/app.entity';

@Module({
  controllers: [FoldersController],
  imports: [TypeOrmModule.forFeature([App, Folder, FolderApp])],
  providers: [FoldersService],
})
export class FoldersModule {}
