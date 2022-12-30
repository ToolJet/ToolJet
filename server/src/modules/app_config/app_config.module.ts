import { Module } from '@nestjs/common';
import { AppConfigController } from '@controllers/app_config.controller';
import { AppConfigService } from '@services/app_config.service';
import { InstanceSettingsModule } from '../instance_settings/instance_settings.module';

@Module({
  controllers: [AppConfigController],
  imports: [InstanceSettingsModule],
  providers: [AppConfigService],
})
export class AppConfigModule {}
