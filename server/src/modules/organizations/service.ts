import { ConflictException, Injectable, NotAcceptableException, NotImplementedException } from '@nestjs/common';
import { Organization } from 'src/entities/organization.entity';
import { isSuperAdmin } from 'src/helpers/utils.helper';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import { EntityManager } from 'typeorm';
import { OrganizationRepository } from '@modules/organizations/repository';
import { OrganizationStatusUpdateDto, OrganizationUpdateDto } from '@modules/organizations/dto';
import { IOrganizationsService } from '@modules/organizations/interfaces/IService';
import { LicenseOrganizationService } from '@modules/licensing/services/organization.service';
import { WORKSPACE_STATUS } from '@modules/users/constants/lifecycle';

@Injectable()
export class OrganizationsService implements IOrganizationsService {
  constructor(
    protected organizationRepository: OrganizationRepository,
    protected readonly licenseOrganizationService: LicenseOrganizationService
  ) {}

  async fetchOrganizations(
    user: any,
    status = WORKSPACE_STATUS.ACTIVE,
    currentPage?: number,
    perPageCount?: number,
    name?: string
  ): Promise<{ organizations: Organization[]; totalCount: number }> {
    if (isSuperAdmin(user)) {
      return this.organizationRepository.fetchOrganizationsForSuperAdmin(status, currentPage, perPageCount, name);
    } else {
      return this.organizationRepository.fetchOrganizationsForRegularUser(
        user,
        status,
        currentPage,
        perPageCount,
        name
      );
    }
  }

  async updateOrganizationNameAndSlug(
    organizationId: string,
    updatableData: OrganizationUpdateDto
  ): Promise<Organization> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      await this.organizationRepository.updateOne(organizationId, updatableData, manager);
      return;
    });
  }

  async updateOrganizationStatus(
    organizationId: string,
    updatableData: OrganizationStatusUpdateDto
  ): Promise<Organization> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      await this.organizationRepository.updateOne(organizationId, updatableData, manager);
      if (updatableData.status === WORKSPACE_STATUS.ACTIVE) {
        await this.licenseOrganizationService.validateOrganization(manager); //Check for only unarchiving
      }
      return;
    });
  }

  async checkWorkspaceUniqueness(name: string, slug: string) {
    if (!(slug || name)) {
      throw new NotAcceptableException('Request should contain the slug or name');
    }
    const result = await this.organizationRepository.findOne({
      where: {
        ...(name && { name }),
        ...(slug && { slug }),
      },
    });
    if (result) throw new ConflictException(`Workspace ${name ? 'name' : 'slug'} already exists`);
    return;
  }

  async checkWorkspaceNameUniqueness(name: string) {
    if (!name) {
      throw new NotAcceptableException('Request should contain workspace name');
    }
    const result = await this.organizationRepository.count({
      where: {
        ...(name && { name }),
      },
    });
    if (result) throw new ConflictException('Workspace name must be unique');
    return;
  }

  async setDefaultWorkspace(organizationId: string, manager?: EntityManager): Promise<void> {
    throw new NotImplementedException('This feature is only available in Enterprise Edition');
  }
}
