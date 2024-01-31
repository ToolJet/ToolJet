import { Global, Module } from '@nestjs/common';
import { LicenseService } from '@services/license.service';
import { LicenseController } from '@controllers/license.controller';

@Global()
@Module({
  providers: [LicenseService],
  controllers: [LicenseController],
  exports: [LicenseService],
})
export class LicenseModule {}
