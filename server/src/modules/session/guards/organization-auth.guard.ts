import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OrganizationAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Flags (keep if required by app logic)
    request.isUserNotMandatory = true;
    request.isFetchingOrganization = true;

    // ❌ Block unauthenticated requests
    if (!request?.cookies?.tj_auth_token) {
      throw new UnauthorizedException('Authentication required');
    }

    // ✅ Validate JWT using passport strategy
    const result = await super.canActivate(context);

    return result as boolean;
  }
}