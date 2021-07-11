import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { App } from '../entities/app.entity';
import { AppsController } from '../controllers/apps.controller';
import { AppsService } from './apps.service';

@Module({
  imports: [TypeOrmModule.forFeature([App])],
  providers: [AppsService],
  controllers: [AppsController],
})
export class AppsModule {}
