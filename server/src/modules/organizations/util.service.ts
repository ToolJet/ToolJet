import { Injectable } from '@nestjs/common';
import { OrganizationRepository } from './repository';
import { BadRequestException } from '@nestjs/common';
import { IOrganizationUtilService } from './interfaces/IUtilService';

@Injectable()
export class OrganizationsUtilService implements IOrganizationUtilService {
  constructor(protected readonly organizationRepository: OrganizationRepository) {}

  async validateWorkspaceExists(workspaceId: string) {
    const existingWorkspace = await this.organizationRepository.findOne({
      where: { id: workspaceId },
    });
    if (!existingWorkspace) {
      throw new BadRequestException(`Invalid workspaceId: ${workspaceId}`);
    }
  }
}
