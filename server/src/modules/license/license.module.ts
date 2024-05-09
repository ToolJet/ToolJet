import { Global, Module } from '@nestjs/common';
import { LicenseService } from '@services/license.service';
import { LicenseCountsService } from '@services/license_counts.service';
import { LicenseController } from '@controllers/license.controller';

@Global()
@Module({
  providers: [LicenseService, LicenseCountsService],
  controllers: [LicenseController],
  exports: [LicenseService, LicenseCountsService],
})
export class LicenseModule {}
