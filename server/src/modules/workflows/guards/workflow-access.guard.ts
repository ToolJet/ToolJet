import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { User } from '@entities/user.entity';
import { VersionRepository } from '@modules/versions/repository';

@Injectable()
export class WorkflowAccessGuard implements CanActivate {
  constructor(private readonly versionRepository: VersionRepository) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { workflowId: appVersionId } = request.params;
    const user: User = request.user;

    // Validate appVersionId parameter
    if (!appVersionId) {
      throw new BadRequestException('App Version ID is required');
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(appVersionId)) {
      throw new BadRequestException('Invalid workflow ID format');
    }

    // User is mandatory
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Find the app/workflow by version ID
    const app = await this.versionRepository.findAppFromVersion(appVersionId, user.organizationId);

    // If app is not found, throw NotFoundException
    if (!app) {
      throw new NotFoundException('Workflow not found');
    }

    // Verify this is actually a workflow (not a regular app)
    // Workflows in ToolJet are AppVersions with type='workflow'
    const appVersion = await this.versionRepository.findOne({
      where: { id: appVersionId },
      relations: ['app'],
    });

    if (!appVersion || appVersion.app?.type !== 'workflow') {
      throw new NotFoundException('Workflow not found or invalid type');
    }

    // Attach the found app and workflow to the request for use in controllers
    request.tj_app = app;
    request.tj_workflow = appVersion;
    request.tj_resource_id = app.id;

    // Return true to allow the request to proceed
    return true;
  }
}