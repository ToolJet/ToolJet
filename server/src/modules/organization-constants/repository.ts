import { Repository, DataSource } from 'typeorm';
import { OrganizationConstant } from '@entities/organization_constants.entity';
import { Injectable } from '@nestjs/common';
import { OrganizationConstantType } from './constants';

@Injectable()
export class OrganizationConstantRepository extends Repository<OrganizationConstant> {
  constructor(private readonly dataSource: DataSource) {
    super(OrganizationConstant, dataSource.createEntityManager());
  }

  // Updated function to find all organization constants by organizationId
  async findAllByOrganizationId(organizationId: string, type?: OrganizationConstantType) {
    const whereCondition: any = {
      organizationId,
    };
    // Add type filter if provided
    if (type) {
      whereCondition.type = type;
    }
    return this.find({
      where: whereCondition,
      relations: ['orgEnvironmentConstantValues'],
    });
  }

  // Loads constants with every environment value and the creating/updating users in one query. Only the
  // user columns the list needs are selected, so no credentials come along. Values are still encrypted.
  async findWithValuesAndUsers(organizationId: string, constantId?: string): Promise<OrganizationConstant[]> {
    const userColumns = { id: true, firstName: true, lastName: true };
    return this.find({
      where: { organizationId, ...(constantId && { id: constantId }) },
      relations: { orgEnvironmentConstantValues: true, createdByUser: true, updatedByUser: true },
      select: {
        id: true,
        constantName: true,
        type: true,
        createdAt: true,
        updatedAt: true,
        orgEnvironmentConstantValues: { environmentId: true, value: true },
        createdByUser: userColumns,
        updatedByUser: userColumns,
      },
    });
  }

  async findOneByIdAndOrganizationId(constantId: string, organizationId: string) {
    return this.findOne({
      where: { id: constantId, organizationId },
      relations: ['orgEnvironmentConstantValues'],
    });
  }

  async findOneByNameAndOrganizationId(constantName: string, organizationId: string) {
    return this.findOne({
      where: { constantName, organizationId },
      relations: ['orgEnvironmentConstantValues'],
    });
  }

  async findByEnvironment(organizationId: string, environmentId: string, type?: OrganizationConstantType) {
    const whereCondition: any = {
      organizationId,
      orgEnvironmentConstantValues: {
        environmentId,
      },
    };

    // Add type filter if provided
    if (type) {
      whereCondition.type = type;
    }

    return this.find({
      where: whereCondition,
      relations: ['orgEnvironmentConstantValues'],
    });
  }

  async findOneByNameOrganizationIdAndType(
    constantName: string,
    organizationId: string,
    type: OrganizationConstantType
  ) {
    return this.findOne({
      where: { constantName, organizationId, type },
      relations: ['orgEnvironmentConstantValues'],
    });
  }

  async deleteOneById(constantId: string) {
    return this.delete({ id: constantId });
  }
}
