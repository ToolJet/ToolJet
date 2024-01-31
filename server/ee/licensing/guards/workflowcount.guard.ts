import { CanActivate, ExecutionContext, HttpException, Injectable } from '@nestjs/common';
import { LICENSE_FIELD, LICENSE_LIMIT } from 'src/helpers/license.helper';
import { App } from 'src/entities/app.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { LicenseService } from '@services/license.service';

@Injectable()
export class WorkflowCountGuard implements CanActivate {
  constructor(
    @InjectRepository(App)
    private appsRepository: Repository<App>,
    private licenseService: LicenseService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    // If it's not workflow creation - Don't execute further
    if (request.body?.type !== 'workflow') return true;

    if (!(await this.licenseService.getLicenseTerms(LICENSE_FIELD.VALID))) {
      throw new HttpException('Workflows are available only in paid plans', 451);
    }

    const workflowsLimit = await this.licenseService.getLicenseTerms(LICENSE_FIELD.WORKFLOWS);

    if (request?.headers['tj-workspace-id']) {
      // Workspace Level - Total Workflows
      if (
        workflowsLimit.workspace.total !== LICENSE_LIMIT.UNLIMITED &&
        (await this.appsRepository.count({
          where: {
            organizationId: request?.headers['tj-workspace-id'] ?? '',
            type: 'workflow',
          },
        })) >= workflowsLimit.workspace.total
      ) {
        throw new HttpException('Maximum workflow limit reached for the current workspace', 451);
      }

      // Instance Level - Total Workflows
      if (
        workflowsLimit.instance.total !== LICENSE_LIMIT.UNLIMITED &&
        (await this.appsRepository.count({
          where: {
            type: 'workflow',
          },
        })) >= workflowsLimit.instance.total
      ) {
        throw new HttpException('Maximum workflow limit reached', 451);
      }
    }

    return true;
  }
}
