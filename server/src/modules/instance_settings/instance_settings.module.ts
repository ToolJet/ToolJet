import { InstanceSettingsController } from '@controllers/instance_settings.controller';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstanceSettingsService } from '@services/instance_settings.service';
import { InstanceSettings } from 'src/entities/instance_settings.entity';

@Module({
  controllers: [InstanceSettingsController],
  imports: [TypeOrmModule.forFeature([InstanceSettings])],
  providers: [InstanceSettingsService],
})
export class InstanceSettingsModule {}
