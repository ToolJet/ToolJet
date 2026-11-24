import { Injectable } from '@nestjs/common';
import { PermissionSubject, ResolveViewAsInput, ViewAsIdentity, requesterSubject } from './types/view-as';

@Injectable()
export class ViewAsService {
  // CE doesn't enforce page, component or query permissions, so there is nothing to simulate:
  // every request is evaluated as the requester.
  async resolve({ user }: ResolveViewAsInput): Promise<PermissionSubject> {
    return requesterSubject(user);
  }

  async describe(subject: PermissionSubject, organizationId: string): Promise<ViewAsIdentity | null> {
    return null;
  }
}
