import { Injectable, CanActivate, ExecutionContext, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { App } from 'src/entities/app.entity';
import { Repository } from 'typeorm';
import { LicenseService } from '@services/license.service';
import { LICENSE_FIELD } from 'src/helpers/license.helper';
import { LICENSE_LIMIT } from 'src/helpers/license.helper';

@Injectable()
export class AppCountGuard implements CanActivate {
  constructor(
    private licenseService: LicenseService,
    @InjectRepository(App)
    private appsRepository: Repository<App>
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const appCount = await this.licenseService.getLicenseTerms(LICENSE_FIELD.APP_COUNT);
    if (appCount === LICENSE_LIMIT.UNLIMITED) {
      return true;
    }

    if ((await this.appsRepository.count()) >= appCount) {
      throw new HttpException('You have reached your maximum limit for apps.', 451);
    }
    return true;
  }
}
