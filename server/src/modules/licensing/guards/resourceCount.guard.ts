import { Injectable, CanActivate, ExecutionContext, HttpException, BadRequestException } from '@nestjs/common';
import { AppsRepository } from '@modules/apps/repository';
import { APP_TYPES } from '@modules/apps/constants';
import { LICENSE_FIELD, LICENSE_LIMIT } from '../constants';
import { LicenseTermsService } from '../interfaces/IService';
import { EntityManager } from 'typeorm';
import { dbTransactionWrap } from '@helpers/database.helper';
import { TOOLJET_EDITIONS } from '@modules/app/constants';
import { getTooljetEdition } from '@helpers/utils.helper';
import { WORKSPACE_STATUS } from '@modules/users/constants/lifecycle';
import { App } from '@entities/app.entity';

@Injectable()
export class ResourceCountGuard implements CanActivate {
  constructor(
    protected appsRepository: AppsRepository,
    protected licenseTermsService: LicenseTermsService
  ) {}

  //Use this common guard for Apps/Workflow

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    //App Type
    const appType = request.body?.app?.[0]?.definition?.appV2?.type;

    if (appType === APP_TYPES.WORKFLOW) {
      return this.checkWorkflowLimit(request);
    } else if (appType === APP_TYPES.FRONT_END) {
      return this.checkAppLimit(request);
    } else {
      return true; //For Modules and other Resources allow
    }
  }

  private async checkWorkflowLimit(request: any): Promise<boolean> {
    if (!request?.headers['tj-workspace-id']) {
      return false;
    }

    const workflowsLimit = await this.licenseTermsService.getLicenseTerms(
      LICENSE_FIELD.WORKFLOWS,
      request?.headers['tj-workspace-id']
    );

    if (!workflowsLimit?.workspace && !workflowsLimit?.instance) {
      throw new HttpException('Workflow is not enabled in the license, contact admin', 404);
    }

    // Workspace Level - Total Workflows
    if (workflowsLimit?.workspace && workflowsLimit.workspace.total !== LICENSE_LIMIT.UNLIMITED) {
      const count = await this.appsRepository.count({
        where: {
          organizationId: request?.headers['tj-workspace-id'] ?? '',
          type: APP_TYPES.WORKFLOW,
        },
      });

      if (count >= workflowsLimit.workspace.total) {
        throw new HttpException('Maximum workflow limit reached for the current workspace', 451);
      }
    }

    // Instance Level - Total Workflows
    if (workflowsLimit?.instance && workflowsLimit.instance.total !== LICENSE_LIMIT.UNLIMITED) {
      const count = await this.appsRepository.count({
        where: { type: APP_TYPES.WORKFLOW },
      });

      if (count >= workflowsLimit.instance.total) {
        throw new HttpException('Maximum workflow limit reached', 451);
      }
    }

    return true;
  }

  private async checkAppLimit(request: any): Promise<boolean> {
    const organizationId = request?.user?.organizationId;

    return await dbTransactionWrap(async (manager: EntityManager) => {
      const appCount = await this.licenseTermsService.getLicenseTerms(LICENSE_FIELD.APP_COUNT, organizationId);

      if (appCount === LICENSE_LIMIT.UNLIMITED) {
        return true;
      }

      if ((await this.fetchTotalAppCount(manager, organizationId)) >= appCount) {
        throw new HttpException('You have reached your maximum limit for apps.', 451);
      }

      return true;
    });
  }
  private async fetchTotalAppCount(manager: EntityManager, organizationId: string): Promise<number> {
    const edition: TOOLJET_EDITIONS = getTooljetEdition() as TOOLJET_EDITIONS;
    const whereCondition: any = {
      type: APP_TYPES.FRONT_END,
      organization: {
        status: WORKSPACE_STATUS.ACTIVE,
      },
    };
    // Fetch apps using organization ID only for cloud
    if (edition === TOOLJET_EDITIONS.Cloud) {
      if (!organizationId) {
        throw new BadRequestException('Invalid Organization Id');
      }
      whereCondition.organization.id = organizationId;
    }
    const apps = await manager.find(App, {
      where: whereCondition,
      relations: ['organization'],
    });

    return apps.length;
  }
}
