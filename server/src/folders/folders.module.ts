import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Folder } from './folder.entity';
import { FoldersController } from './folders.controller';
import { FoldersService } from './folders.service';

@Module({
  controllers: [FoldersController],
  imports: [TypeOrmModule.forFeature([Folder])],
  providers: [FoldersService],
})
export class FoldersModule {}
