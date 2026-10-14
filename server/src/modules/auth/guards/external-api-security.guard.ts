import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { AppsRepository } from '@modules/apps/repository';

@Injectable()
export class ExternalApiSecurityGuard implements CanActivate {
  constructor(
    protected configService: ConfigService,
    protected licenseTermsService: LicenseTermsService,
    protected appRepository: AppsRepository
  ) {}

  async canActivate(_context: ExecutionContext): Promise<boolean> {
    //Disabled for CE
    return false;
  }
}
