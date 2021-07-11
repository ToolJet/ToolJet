import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FolderApp } from 'src/entities/folder_apps.entity';
import { Folder } from '../entities/folder.entity';
import { FoldersController } from './folders.controller';
import { FoldersService } from './folders.service';

@Module({
  controllers: [FoldersController],
  imports: [TypeOrmModule.forFeature([Folder, FolderApp])],
  providers: [FoldersService],
})
export class FoldersModule {}
