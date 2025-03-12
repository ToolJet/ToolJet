import { Injectable, CanActivate, ExecutionContext, HttpException } from '@nestjs/common';
import { LICENSE_FIELD, LICENSE_TYPE } from '@modules/licensing/constants';
import { LicenseTermsService } from '../interfaces/IService';

@Injectable()
export class AuditLogsDurationGuard implements CanActivate {
  constructor(protected licenseTermsService: LicenseTermsService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const {
      status: { licenseType },
      maxDurationForAuditLogs,
      auditLogsEnabled,
    } = await this.licenseTermsService.getLicenseTerms([
      LICENSE_FIELD.STATUS,
      LICENSE_FIELD.MAX_DURATION_FOR_AUDIT_LOGS,
      LICENSE_FIELD.AUDIT_LOGS,
    ]);
    if (!auditLogsEnabled) {
      throw new HttpException(
        "Oops! Your current plan doesn't have access to this feature. Please upgrade your plan now to use this.",
        451
      );
    }
    const request = context.switchToHttp().getRequest();
    const { timeFrom, timeTo } = request.query;
    if (!timeFrom || !timeTo) {
      throw new HttpException(
        "Both 'timeFrom' and 'timeTo' are required parameters for this operation. Please provide both values.",
        400
      );
    }

    const currentDateUTC = Date.now();
    const fromDateUTC = Date.UTC(
      new Date(timeFrom).getUTCFullYear(),
      new Date(timeFrom).getUTCMonth(),
      new Date(timeFrom).getUTCDate()
    );

    const toDateUTC = Date.UTC(
      new Date(timeTo).getUTCFullYear(),
      new Date(timeTo).getUTCMonth(),
      new Date(timeTo).getUTCDate()
    );

    const differenceInDays = (toDateUTC - fromDateUTC) / (1000 * 3600 * 24);

    if (licenseType === LICENSE_TYPE.BUSINESS) {
      const validStartDateUTC = currentDateUTC - maxDurationForAuditLogs * 24 * 60 * 60 * 1000;

      if (fromDateUTC < validStartDateUTC || toDateUTC < validStartDateUTC) {
        throw new HttpException(
          `You can only access logs from the last ${maxDurationForAuditLogs} days. Please adjust your time range.`,
          451
        );
      }
    }

    if (differenceInDays > maxDurationForAuditLogs) {
      throw new HttpException(
        `You can only access logs for a maximum duration of ${maxDurationForAuditLogs} days. Please adjust your time range.`,
        451
      );
    }

    return true;
  }
}
