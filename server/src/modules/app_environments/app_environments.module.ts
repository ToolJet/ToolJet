import { AppEnvironmentsController } from '@controllers/app_environments.controller';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppEnvironmentService } from '@services/app_environments.service';
import { AppEnvironment } from 'src/entities/app_environments.entity';
import { DataSourceOptions } from 'src/entities/data_source_options.entity';
import { CaslModule } from '../casl/casl.module';

@Module({
  controllers: [AppEnvironmentsController],
  imports: [TypeOrmModule.forFeature([AppEnvironment, DataSourceOptions]), CaslModule],
  providers: [AppEnvironmentService],
})
export class AppEnvironmentsModule {}
