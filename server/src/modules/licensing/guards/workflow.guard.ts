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
  ) { }

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

    // Workspace Level 
    if (workflowsLimit?.workspace) {
      const needsDailyCheck = workflowsLimit.workspace.daily_executions !== LICENSE_LIMIT.UNLIMITED;
      const needsMonthlyCheck = workflowsLimit.workspace.monthly_executions !== LICENSE_LIMIT.UNLIMITED;

      if (needsDailyCheck || needsMonthlyCheck) {
        const workspaceCounts = (
          await this.manager.query(
            `SELECT
              COUNT(*) FILTER (WHERE we.created_at >= date_trunc('day', current_date)) as daily_count,
              COUNT(*) as monthly_count
            FROM apps a
            INNER JOIN app_versions av ON av.app_id = a.id
            INNER JOIN workflow_executions we ON we.app_version_id = av.id
            WHERE a.organization_id = $1
            AND we.created_at >= date_trunc('month', current_date)
            AND we.created_at < date_trunc('month', current_date) + interval '1 month'`,
            [organizationId]
          )
        )[0];

        if (needsDailyCheck && parseInt(workspaceCounts.daily_count, 10) >= workflowsLimit.workspace.daily_executions) {
          throw new HttpException('Maximum daily limit for workflow execution has reached for this workspace', 451);
        }

        if (needsMonthlyCheck && parseInt(workspaceCounts.monthly_count, 10) >= workflowsLimit.workspace.monthly_executions) {
          throw new HttpException('Maximum monthly limit for workflow execution has reached for this workspace', 451);
        }
      }
    }

    // Instance Level 
    if (workflowsLimit?.instance) {
      const needsDailyCheck = workflowsLimit.instance.daily_executions !== LICENSE_LIMIT.UNLIMITED;
      const needsMonthlyCheck = workflowsLimit.instance.monthly_executions !== LICENSE_LIMIT.UNLIMITED;

      if (needsDailyCheck || needsMonthlyCheck) {
        const instanceCounts = (
          await this.manager.query(
            `SELECT
              COUNT(*) FILTER (WHERE we.created_at >= date_trunc('day', current_date)) as daily_count,
              COUNT(*) as monthly_count
            FROM workflow_executions we
            WHERE we.created_at >= date_trunc('month', current_date)
            AND we.created_at < date_trunc('month', current_date) + interval '1 month'`
          )
        )[0];

        if (needsDailyCheck && parseInt(instanceCounts.daily_count, 10) >= workflowsLimit.instance.daily_executions) {
          throw new HttpException('Maximum daily limit for workflow execution has been reached', 451);
        }

        if (needsMonthlyCheck && parseInt(instanceCounts.monthly_count, 10) >= workflowsLimit.instance.monthly_executions) {
          throw new HttpException('Maximum monthly limit for workflow execution has been reached', 451);
        }
      }
    }

    return true;
  }
}
