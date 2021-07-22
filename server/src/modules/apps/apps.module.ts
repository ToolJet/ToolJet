import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { App } from '../../entities/app.entity';
import { AppsController } from '../../controllers/apps.controller';
import { AppsService } from '../../services/apps.service';
import { AppVersion } from '../../../src/entities/app_version.entity';
import { DataQuery } from '../../../src/entities/data_query.entity';
import { CaslModule } from '../casl/casl.module';

@Module({
  imports: [TypeOrmModule.forFeature([App, AppVersion, DataQuery]), CaslModule],
  providers: [AppsService],
  controllers: [AppsController],
})
export class AppsModule {}
