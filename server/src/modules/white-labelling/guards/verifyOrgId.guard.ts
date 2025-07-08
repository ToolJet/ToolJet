import { Organization } from '@entities/organization.entity';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

@Injectable()
export class OrganizationIdSlugValidationGuard implements CanActivate {
  constructor(private readonly entityManager: EntityManager) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const workspaceId = request?.params.organizationId;
    let organization: Organization;

    try {
      organization = await this.entityManager.findOneOrFail(Organization, { where: { id: workspaceId } });
    } catch {
      organization = await this.entityManager.findOne(Organization, { where: { slug: workspaceId } });
    }
    if (!organization) {
      //assign default organization id
      organization = await this.entityManager.findOneOrFail(Organization, { where: { isDefault: true } });
    }
    request.params.organizationId = organization.id;
    return true;
  }
}
