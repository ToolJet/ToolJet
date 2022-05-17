import { Module } from '@nestjs/common';
import { ExtensionsService } from '../../services/extensions.service';
import { ExtensionsController } from '../../controllers/extensions.controller';
import { Extension } from 'src/entities/extension.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileService } from '@services/file.service';
import { File } from 'src/entities/file.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Extension, File])],
  controllers: [ExtensionsController],
  providers: [ExtensionsService, FileService],
})
export class ExtensionsModule {}
