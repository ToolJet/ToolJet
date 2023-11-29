import { Injectable, CanActivate, ExecutionContext, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { App } from 'src/entities/app.entity';
import { Repository, Not } from 'typeorm';
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
    const request = context.switchToHttp().getRequest();
    const organizationId = request.headers['tj-workspace-id'];

    // Skip the check if type is 'workflow'
    const appCreateDto = request.body;
    if (appCreateDto.type === 'workflow') {
      return true;
    }

    const appCount = await this.licenseService.getLicenseTerms(LICENSE_FIELD.APP_COUNT, organizationId);
    if (appCount === LICENSE_LIMIT.UNLIMITED) {
      return true;
    }
    const organizationAppCount = await this.appsRepository.count({
      where: {
        organizationId: organizationId,
        type: Not('workflow'),
      },
    });

    if (organizationAppCount >= appCount) {
      throw new HttpException('You have reached your maximum limit for apps.', 451);
    }
    return true;
  }
}
