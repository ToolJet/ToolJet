import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OrganizationAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<any> {
    let user;
    const request = context.switchToHttp().getRequest();
    request.isOrganizationLogin = true;
    if (request.headers['authorization']) {
      try {
        user = await super.canActivate(context);
      } catch (err) {
        return true;
      }
      return user;
    }
    return true;
  }
}
