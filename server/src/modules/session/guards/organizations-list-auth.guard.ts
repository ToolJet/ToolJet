import { ExecutionContext, Injectable } from '@nestjs/common';
import { OrganizationAuthGuard } from './organization-auth.guard';

@Injectable()
export class OrganizationsListAuthGuard extends OrganizationAuthGuard {
  async canActivate(context: ExecutionContext): Promise<any> {
    const request = context.switchToHttp().getRequest();
    request.isGettingOrganizations = true;
    
    return super.canActivate(context);
  }
} 
