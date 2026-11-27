import { CanActivate, ExecutionContext, Injectable, HttpException } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { AppVersion } from 'src/entities/app_version.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { LICENSE_FIELD } from '../constants';
import { LicenseTermsService } from '../interfaces/IService';

@Injectable()
export class WorkflowGuard implements CanActivate {
  // manager is no longer used here but stays in the signature: the EE WorkflowGuard passes it on
  constructor(
    protected manager: EntityManager,
    @InjectRepository(AppVersion)
    protected appsVersionRepository: Repository<AppVersion>,
    protected licenseTermsService: LicenseTermsService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const organizationId = request?.headers['tj-workspace-id'] ?? '';
    if (!organizationId) throw new HttpException(`WorkspaceId is missing`, 400);

    let workflowId = '';

    if (request?.body?.appVersionId) {
      const workflowApp = await this.appsVersionRepository.findOne({
        where: {
          id: request.body.appVersionId,
        },
      });

      if (!workflowApp) throw new HttpException(`Workflow doesn't exists`, 404);
      workflowId = workflowApp.appId;
    }

    if (request?.body?.appId) {
      workflowId = request.body.appId;
    }
    if (!workflowId) throw new HttpException(`WorkflowId is missing`, 400);

    const workflowsLimit = await this.licenseTermsService.getLicenseTerms(LICENSE_FIELD.WORKFLOWS, organizationId);
    if (!workflowsLimit?.workspace && !workflowsLimit?.instance)
      throw new HttpException('Workflow is not enabled in the license, contact admin', 451);

    // The daily/monthly execution quota is reserved where the run is created
    // (ExecutionQuotaService, via WorkflowExecutionsService.create), atomically and for every trigger.

    return true;
  }
}
