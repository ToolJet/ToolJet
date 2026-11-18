import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, HttpException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { LicenseTermsService } from '../interfaces/IService';
import { LICENSE_FIELD } from '../constants';
import { AppsRepository } from '@modules/apps/repository';
import { APP_TYPES } from '@modules/apps/constants';
import { isUUID } from 'class-validator';
import { secretsMatch } from '@helpers/secret-compare.helper';
import { AppVersion } from '@entities/app_version.entity';

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

    // WebHook endpoint must be enabled inorder to use it. Enablement is branch-scoped on
    // app_versions, and propagate_workflow_enabled keeps a branch's version rows in step, so one
    // rule covers every case: no ?version= reads the released row, a version name reads that row.
    //
    // Scoped to the trigger routes — status/stream/terminate share this guard and ignore
    // ?version=, so an unscoped read would let a stray param pick their gate.
    const routePath = request?.route?.path ?? '';
    const acceptsVersion = routePath.endsWith('/trigger') || routePath.endsWith('/trigger-async');

    // Express `qs` yields an array for ?version[]=a&version[]=b, same as the workspace header above.
    const rawVersion = request?.query?.version;
    const versionRef = Array.isArray(rawVersion) ? rawVersion[0] : rawVersion;

    let enablementRow: AppVersion = null;
    if (acceptsVersion && versionRef) {
      enablementRow = await this.manager.findOne(AppVersion, {
        where: { appId: workflowApp.id, name: versionRef },
        select: ['id', 'workflowEnabled'],
      });
      // An unknown version is deliberately not a 403 — fall through so the service raises its 404
      // naming the version. A 403 here reads as "webhook disabled" and misdirects debugging.
    }

    const enablementSource =
      enablementRow ??
      (workflowApp.currentVersionId
        ? await this.manager.findOne(AppVersion, {
            where: { id: workflowApp.currentVersionId },
            select: ['id', 'workflowEnabled'],
          })
        : null);

    // NULL until the data migration backfills the version row - the app-level flag is what it will copy.
    if (!(enablementSource?.workflowEnabled ?? workflowApp.workflowEnabled)) {
      throw new HttpException(`Webhook endpoint disabled or doesn't exists`, 403);
    }

    // The daily/monthly execution quota is reserved where the run is created
    // (ExecutionQuotaService, via WorkflowExecutionsService.create), so it applies to the trigger
    // routes only and never blocks reading a run's status.

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
    if (secretsMatch(token, workflowApp.workflowApiToken)) {
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
    return secretsMatch(token, externalApiAccessToken);
  }
}
