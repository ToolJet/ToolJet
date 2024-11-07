import { Global, Module } from '@nestjs/common';
import { LicenseService } from '@licensing/service';

@Global()
@Module({
  providers: [LicenseService],
  exports: [LicenseService],
})
export class LicenseModule {}
