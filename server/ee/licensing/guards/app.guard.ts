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
    const appsCount = await this.licenseService.getLicenseTerms(LICENSE_FIELD.APP_COUNT);
    if (appsCount === 'UNLIMITED') {
      return true;
    }

    if ((await this.appsRepository.count()) >= appsCount) {
      throw new HttpException('Maximum application limit reached', 451);
    }
    return true;
  }
}
