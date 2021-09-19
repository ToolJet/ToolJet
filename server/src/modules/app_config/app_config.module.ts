import { Module } from '@nestjs/common';
import { AppConfigController } from '@controllers/app_config.controller';
import { AppConfigService } from '@services/app_config.service';

@Module({
  controllers: [AppConfigController],
  imports: [],
  providers: [AppConfigService],
})
export class AppConfigModule {}
