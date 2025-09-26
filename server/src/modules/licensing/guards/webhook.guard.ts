import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, HttpException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { LicenseTermsService } from '../interfaces/IService';
import { LICENSE_FIELD, LICENSE_LIMIT } from '../constants';
import { AppsRepository } from '@modules/apps/repository';
import { APP_TYPES } from '@modules/apps/constants';
import { isUUID } from 'class-validator';

@Injectable()
export class WebhookGuard implements CanActivate {
  constructor(
    protected manager: EntityManager,
    protected readonly appsRepository: AppsRepository,
    protected licenseTermsService: LicenseTermsService,
    protected configService: ConfigService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const organizationId =
      typeof request.headers['tj-workspace-id'] === 'object'
        ? request.headers['tj-workspace-id'][0]
        : request.headers['tj-workspace-id'];
    const workflowsLimit = await this.licenseTermsService.getLicenseTerms(LICENSE_FIELD.WORKFLOWS, organizationId);

    const isUuid = isUUID(request?.params?.idOrName);
    const workflowApp = await this.appsRepository.findOne({
      where: {
        [isUuid ? 'id' : 'name']: request?.params?.idOrName,
        type: APP_TYPES.WORKFLOW,
      },
    });

    if (!workflowApp) throw new HttpException(`Workflow doesn't exists`, 404);
    request.tj_app = workflowApp;

    // Dual authentication: Webhook API token OR External API token validation
    const isAuthenticated = await this.validateAuthentication(request, workflowApp);
    if (!isAuthenticated) throw new UnauthorizedException('Invalid authentication token');

    // Workflow must be enabled inorder to use it
    if (!workflowApp.isMaintenanceOn) throw new HttpException(`Workflow is disabled or does not exist`, 403);

    // WebHook endpoint must be enabled inorder to use it
    if (!workflowApp.workflowEnabled) throw new HttpException(`Webhook endpoint disabled or doesn't exists`, 403);

    // Workspace Level -
    if (workflowsLimit.workspace) {
      // Daily Limit
      const workspaceDailyExecutionsQuery = `
        SELECT COUNT(*)
        FROM apps a
        INNER JOIN app_versions av on av.app_id = a.id
        INNER JOIN workflow_executions we on we.app_version_id = av.id
        WHERE a.organization_id = $1
        AND DATE(we.created_at) = current_date
      `;

      if (
        workflowsLimit.workspace.daily_executions !== LICENSE_LIMIT.UNLIMITED &&
        (await this.manager.query(workspaceDailyExecutionsQuery, [workflowApp.organizationId]))[0].count >=
          workflowsLimit.workspace.daily_executions
      ) {
        throw new HttpException('Maximum daily limit for workflow execution has reached for this workspace', 451);
      }

      // Monthly Limit
      const workspaceMonthlyExecutionsQuery = `
        SELECT COUNT(*)
        FROM apps a
        INNER JOIN app_versions av on av.app_id = a.id
        INNER JOIN workflow_executions we on we.app_version_id = av.id
        WHERE a.organization_id = $1
        AND extract (year from we.created_at) = extract (year from current_date)
        AND extract (month from we.created_at) = extract (month from current_date)
      `;

      if (
        workflowsLimit.workspace.monthly_executions !== LICENSE_LIMIT.UNLIMITED &&
        (await this.manager.query(workspaceMonthlyExecutionsQuery, [workflowApp.organizationId]))[0].count >=
          workflowsLimit.workspace.monthly_executions
      ) {
        throw new HttpException('Maximum monthly limit for workflow execution has reached for this workspace', 451);
      }
    }

    // Instance Level -
    if (workflowsLimit.instance) {
      // Daily Limit
      const instanceDailyExecutionsQuery = `
        SELECT COUNT(*)
        FROM apps a
        INNER JOIN app_versions av on av.app_id = a.id
        INNER JOIN workflow_executions we on we.app_version_id = av.id
        WHERE DATE(we.created_at) = current_date
      `;

      if (
        workflowsLimit.instance.daily_executions !== LICENSE_LIMIT.UNLIMITED &&
        (await this.manager.query(instanceDailyExecutionsQuery))[0].count >= workflowsLimit.instance.daily_executions
      ) {
        throw new HttpException('Maximum daily limit for workflow execution has been reached', 451);
      }

      // Monthly Limit
      const instanceMonthlyExecutionsQuery = `
        SELECT COUNT(*)
        FROM apps a
        INNER JOIN app_versions av on av.app_id = a.id
        INNER JOIN workflow_executions we on we.app_version_id = av.id
        WHERE extract (year from we.created_at) = extract (year from current_date)
        AND extract (month from we.created_at) = extract (month from current_date)
      `;

      if (
        workflowsLimit.instance.monthly_executions !== LICENSE_LIMIT.UNLIMITED &&
        (await this.manager.query(instanceMonthlyExecutionsQuery))[0].count >=
          workflowsLimit.instance.monthly_executions
      ) {
        throw new HttpException('Maximum monthly limit for workflow execution has been reached', 451);
      }
    }

    return true;
  }

  /**
   * Validates authentication using either workflow API token or external API token
   * Both use Bearer token format: Authorization: Bearer <token>
   */
  private async validateAuthentication(request: any, workflowApp: any): Promise<boolean> {
    const authHeader = request.headers.authorization;
    if (!authHeader) return false;

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) return false;

    // Method 1: Workflow-specific API token (existing behavior)
    if (token === workflowApp.workflowApiToken) {
      return true;
    }

    // Method 2: External API access token (new feature)
    const isValidExternalToken = await this.validateExternalToken(token);
    if (isValidExternalToken) {
      return true;
    }

    return false;
  }

  /**
   * Validates external API token with proper configuration and license checks
   */
  private async validateExternalToken(token: string): Promise<boolean> {
    // STEP 1: Check if external API is enabled
    const isExternalApiEnabled = this.configService.get<string>('ENABLE_EXTERNAL_API') === 'true';
    if (!isExternalApiEnabled) return false;

    // STEP 2: Check if external API license exists
    const hasLicense = await this.licenseTermsService.getLicenseTermsInstance(LICENSE_FIELD.EXTERNAL_API);
    if (!hasLicense) return false;

    // STEP 3: Validate the token
    const externalApiAccessToken = this.configService.get<string>('EXTERNAL_API_ACCESS_TOKEN');
    return token === externalApiAccessToken;
  }
}
