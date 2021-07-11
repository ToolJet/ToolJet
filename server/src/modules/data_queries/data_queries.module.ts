import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataQuery } from 'src/entities/data_query.entity';
import { DataQueriesController } from 'src/controllers/data_queries.controller';
import { DataQueriesService } from 'src/services/data_queries.service';

@Module({
  imports: [TypeOrmModule.forFeature([DataQuery])],
  providers: [DataQueriesService],
  controllers: [DataQueriesController],
})
export class DataQueriesModule {}
