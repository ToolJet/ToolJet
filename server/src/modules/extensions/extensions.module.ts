import { Module } from '@nestjs/common';
import { ExtensionsService } from '../../services/extensions.service';
import { ExtensionsController } from '../../controllers/extensions.controller';
import { Extension } from 'src/entities/extension.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesService } from '@services/files.service';
import { File } from 'src/entities/file.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Extension, File])],
  controllers: [ExtensionsController],
  providers: [ExtensionsService, FilesService],
})
export class ExtensionsModule {}
