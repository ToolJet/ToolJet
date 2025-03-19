import { Controller, UseGuards, Get } from '@nestjs/common';
import { IAuditLogLicenseController } from '../interfaces/IController';
import { FEATURE_KEY } from '../constants';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { FeatureAbilityGuard } from '../ability/guard';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
@Controller('license/audit-logs')
@UseGuards(JwtAuthGuard, FeatureAbilityGuard)
export class LicenseAuditLogsController implements IAuditLogLicenseController {
  @InitFeature(FEATURE_KEY.CHECK_AUDIT_LOGS_LICENSE)
  @Get('license-terms')
  async getAuditLog() {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.GET_AUDIT_LOGS_MAX_DURATION)
  async getMaxDuration() {
    throw new Error('Method not implemented.');
  }
}
