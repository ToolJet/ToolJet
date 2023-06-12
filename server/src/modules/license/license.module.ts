import { Global, Module } from '@nestjs/common';
import { LicenseService } from '@services/license.service';
import { LicenseController } from '@controllers/license.controller';
import { InstanceSettingsModule } from '../instance_settings/instance_settings.module';

@Global()
@Module({
  imports: [InstanceSettingsModule],
  providers: [LicenseService],
  controllers: [LicenseController],
  exports: [LicenseService],
})
export class LicenseModule {}
