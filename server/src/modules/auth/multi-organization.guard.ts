import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Organization } from 'src/entities/organization.entity';
import { getManager } from 'typeorm';

@Injectable()
export class MultiOrganizationGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (await this.isSingleOrgWithOrganizationAlreadyPresent()) return false;
    return true;
  }

  async isSingleOrgWithOrganizationAlreadyPresent() {
    return (
      this.configService.get<string>('DISABLE_MULTI_WORKSPACE') === 'true' &&
      (await getManager().count(Organization)) > 1
    );
  }
}
