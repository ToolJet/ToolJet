import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataQuery } from 'src/entities/data_query.entity';
import { DataQueriesController } from 'src/controllers/data_queries.controller';
import { DataQueriesService } from 'src/services/data_queries.service';
import { DataSourcesController } from 'src/controllers/data_sources.controller';
import { DataSourcesService } from 'src/services/data_sources.service';
import { DataSource } from 'src/entities/data_source.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DataSource])],
  providers: [DataSourcesService],
  controllers: [DataSourcesController],
})
export class DataSourcesModule {}
