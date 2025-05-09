import { Controller, UseGuards, Get } from '@nestjs/common';
import { IAuditLogLicenseController } from '../interfaces/IController';
import { FEATURE_KEY } from '../constants';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { FeatureAbilityGuard } from '../ability/guard';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
@Controller('license/audit-logs')
@InitModule(MODULES.LICENSING)
@UseGuards(JwtAuthGuard, FeatureAbilityGuard)
export class LicenseAuditLogsController implements IAuditLogLicenseController {
  @InitFeature(FEATURE_KEY.CHECK_AUDIT_LOGS_LICENSE)
  @Get('license-terms')
  async getAuditLog() {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.GET_AUDIT_LOGS_MAX_DURATION)
  @Get('max-duration')
  async getMaxDuration() {
    throw new Error('Method not implemented.');
  }
}
