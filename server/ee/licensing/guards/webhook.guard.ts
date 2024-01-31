import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, HttpException } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { App } from 'src/entities/app.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { LICENSE_LIMIT, LICENSE_FIELD } from 'src/helpers/license.helper';
import { LicenseService } from '@services/license.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WebhookGuard implements CanActivate {
  constructor(
    private manager: EntityManager,
    @InjectRepository(App)
    private appsRepository: Repository<App>,
    private licenseService: LicenseService,
    private configService: ConfigService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const workflowsLimit = await this.licenseService.getLicenseTerms(LICENSE_FIELD.WORKFLOWS);

    const workflowApp = await this.appsRepository.findOne({
      where: {
        id: request?.params?.id,
        type: 'workflow',
      },
    });

    if (!workflowApp) throw new HttpException(`Workflow doesn't exists`, 404);

    // Webhook API token validation
    if (request.headers.authorization.split(' ')[1] !== workflowApp.workflowApiToken) throw new UnauthorizedException();

    // WebHook endpoint must be enabled inorder to use it
    if (!workflowApp.workflowEnabled) throw new HttpException(`Webhook endpoint disabled or doesn't exists`, 404);

    // Workspace Level -
    // Daily Limit
    if (
      workflowsLimit.workspace.daily_executions !== LICENSE_LIMIT.UNLIMITED &&
      (
        await this.manager.query(
          `SELECT COUNT(*)
        FROM apps a
        INNER JOIN app_versions av on av.app_id = a.id
        INNER JOIN workflow_executions we on we.app_version_id = av.id
        WHERE a.organization_id = $1
        AND DATE(we.created_at) = current_date`,
          [workflowApp.organizationId]
        )
      )[0].count >= workflowsLimit.workspace.daily_executions
    ) {
      throw new HttpException('Maximum daily limit for workflow execution has reached for this workspace', 451);
    }

    // Monthly Limit
    if (
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
          [workflowApp.organizationId]
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
        WHERE DATE(we.created_at) = current_date`)
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
