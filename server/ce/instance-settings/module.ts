import { Global, Module } from '@nestjs/common';
import { InstanceSettingsService } from '@instance-settings/service';

@Global()
@Module({
  providers: [InstanceSettingsService],
  exports: [InstanceSettingsService],
})
export class InstanceSettingsModule {}
