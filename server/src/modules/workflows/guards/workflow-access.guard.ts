import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class WorkflowAccessGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const workflowId = request.params.workflowId;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!workflowId) {
      return true; // Allow access if no specific workflow ID
    }

    // Basic validation - ensure user has access to workflows
    // In EE version, this would check specific workflow permissions
    return true;
  }
}