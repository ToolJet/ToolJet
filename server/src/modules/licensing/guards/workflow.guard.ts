import { CanActivate, ExecutionContext, Injectable, HttpException } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { AppVersion } from 'src/entities/app_version.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { LICENSE_FIELD, LICENSE_LIMIT } from '../constants';
import { LicenseTermsService } from '../interfaces/IService';

@Injectable()
export class WorkflowGuard implements CanActivate {
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

    const workflowsLimit = await this.licenseTermsService.getLicenseTerms(LICENSE_FIELD.WORKFLOWS);
    if (!workflowsLimit?.workspace && !workflowsLimit?.instance)
      throw new HttpException('Workflow is not enabled in the license, contact admin', 451);
    // Workspace Level -
    // Daily Limit
    if (
      workflowsLimit?.workspace &&
      workflowsLimit.workspace.daily_executions !== LICENSE_LIMIT.UNLIMITED &&
      (
        await this.manager.query(
          `SELECT COUNT(*)
        FROM apps a
        INNER JOIN app_versions av on av.app_id = a.id
        INNER JOIN workflow_executions we on we.app_version_id = av.id
        WHERE a.organization_id = $1
        AND extract (year from we.created_at) = extract (year from current_date)
        AND extract (month from we.created_at) = extract (month from current_date)
        AND DATE(we.created_at) = current_date`,
          [organizationId]
        )
      )[0].count >= workflowsLimit.workspace.daily_executions
    ) {
      throw new HttpException('Maximum daily limit for workflow execution has reached for this workspace', 451);
    }

    // Monthly Limit
    if (
      workflowsLimit?.workspace &&
      workflowsLimit.workspace.monthly_executions !== LICENSE_LIMIT.UNLIMITED &&
      (
        await this.manager.query(
          `SELECT COUNT(*)
        FROM apps a
        INNER JOIN app_versions av on av.app_id = a.id
        INNER JOIN workflow_executions we on we.app_version_id = av.id
        WHERE a.organization_id = $1
        AND extract (year from we.created_at) = extract (year from current_date)
        AND extract (month from we.created_at) = extract (month from current_date)`,
          [organizationId]
        )
      )[0].count >= workflowsLimit.workspace.monthly_executions
    ) {
      throw new HttpException('Maximum monthly limit for workflow execution has reached for this workspace', 451);
    }

    // Instance Level -
    // Daily Limit
    if (
      workflowsLimit.instance.daily_executions !== LICENSE_LIMIT.UNLIMITED &&
      (
        await this.manager.query(`SELECT COUNT(*)
        FROM apps a
        INNER JOIN app_versions av on av.app_id = a.id
        INNER JOIN workflow_executions we on we.app_version_id = av.id
        WHERE extract (year from we.created_at) = extract (year from current_date)
        AND extract (month from we.created_at) = extract (month from current_date)
        AND DATE(we.created_at) = current_date`)
      )[0].count >= workflowsLimit.instance.daily_executions
    ) {
      throw new HttpException('Maximum daily limit for workflow execution has been reached', 451);
    }

    // Monthly Limit
    if (
      workflowsLimit.instance.monthly_executions !== LICENSE_LIMIT.UNLIMITED &&
      (
        await this.manager.query(`SELECT COUNT(*)
        FROM apps a
        INNER JOIN app_versions av on av.app_id = a.id
        INNER JOIN workflow_executions we on we.app_version_id = av.id
        WHERE extract (year from we.created_at) = extract (year from current_date)
        AND extract (month from we.created_at) = extract (month from current_date)`)
      )[0].count >= workflowsLimit.instance.monthly_executions
    ) {
      throw new HttpException('Maximum monthly limit for workflow execution has been reached', 451);
    }

    return true;
  }
}
