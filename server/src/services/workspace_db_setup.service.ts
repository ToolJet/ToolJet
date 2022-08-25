import { CreateDataSourceDto } from '@dto/data-source.dto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { isEmpty } from 'lodash';
import { Organization } from 'src/entities/organization.entity';
import { EntityManager } from 'typeorm';

@Injectable()
export class WorkspaceDbSetupService {
  constructor(private readonly entityManager: EntityManager) {}

  async perform(manager: EntityManager, organizationId: string): Promise<void> {
    await this.validateOrgExists(manager, organizationId)
    await this.setupWorkspaceDb(organizationId)
  }

  async validateOrgExists(manager: EntityManager, organizationId: string) {

    if (isEmpty(organizationId) || (await this.isOrgEmpty(manager, organizationId))) {
      throw new BadRequestException('Organization not found' + ' ' + organizationId);
    }
  }

  async isOrgEmpty(manager: EntityManager, organizationId:  string) {
    const organization = await manager.findOne(Organization, { where: { id: organizationId }})
    return isEmpty(organization);
  }

  async setupWorkspaceDb(organizationId: string) {
    // const dbUser = `user_${organizationId}`;
    // const dbName = `workspace_${organizationId}_1`;
    // this.createDbUser(dbUser);
    // this.createWorkspaceDb(dbName, dbUser);
    // await this.addWorkspaceDbToDataSource(dbUser, dbName);
  }

  async addWorkspaceDbToDataSource(dbUser: string, dbName: string) {
    // const dto: CreateDataSourceDto = {
    // }
  }


  createDbUser(username: string) {
    this.entityManager.query(`CREATE ROLE "${username}" WITH LOGIN`);
  }

  createWorkspaceDb(dbName: string, dbUser: string) {
    this.entityManager.query(`CREATE DATABASE "${dbName}" WITH OWNER "${dbUser}";`);
  }

}
