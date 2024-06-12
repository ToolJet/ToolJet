import { Global, Module } from '@nestjs/common';
import { LicenseService } from '@services/license.service';
import { LicenseCountsService } from '@services/license_counts.service';
import { LicenseController } from '@controllers/license.controller';
import { OrganizationLicenseService } from '@services/organization_license.service';
import { OrganizationLicenseController } from '@controllers/organization_license.controller';
import { AuditLogsModule } from '../audit_logs/audit_logs.module';

@Global()
@Module({
  imports: [AuditLogsModule],
  providers: [LicenseService, OrganizationLicenseService, LicenseCountsService],
  controllers: [LicenseController, OrganizationLicenseController],
  exports: [LicenseService, OrganizationLicenseService, LicenseCountsService],
})
export class LicenseModule {}
