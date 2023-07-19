import { Injectable, CanActivate, ExecutionContext, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { App } from 'src/entities/app.entity';
import { Repository } from 'typeorm';
import { LicenseService } from '@services/license.service';
import { LICENSE_FIELD } from 'src/helpers/license.helper';

@Injectable()
export class AppCountGuard implements CanActivate {
  constructor(
    private licenseService: LicenseService,
    @InjectRepository(App)
    private appsRepository: Repository<App>
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const licenseTerms = await this.licenseService.getLicenseTerms([LICENSE_FIELD.APP_COUNT, LICENSE_FIELD.IS_EXPIRED]);
    if (licenseTerms[LICENSE_FIELD.APP_COUNT] === 'UNLIMITED' || licenseTerms[LICENSE_FIELD.IS_EXPIRED]) {
      return true;
    }

    if ((await this.appsRepository.count()) >= licenseTerms[LICENSE_FIELD.APP_COUNT]) {
      throw new HttpException('You have reached your maximum limit for apps.', 451);
    }
    return true;
  }
}
