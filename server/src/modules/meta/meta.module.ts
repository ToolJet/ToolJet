import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetadataController } from '@controllers/metadata.controller';
import { Metadata } from 'src/entities/metadata.entity';
import { MetadataService } from '@services/metadata.service';

@Module({
  controllers: [MetadataController],
  imports: [TypeOrmModule.forFeature([Metadata])],
  providers: [MetadataService],
})
export class MetaModule {}
