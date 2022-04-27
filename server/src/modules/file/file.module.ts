import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { File } from 'src/entities/file.entity';
import { FilesController } from '../../controllers/file.controller';
import { FileService } from '../../services/file.service';

@Module({
  imports: [TypeOrmModule.forFeature([File])],
  controllers: [FilesController],
  providers: [FileService],
})
export class FileModule {}
