import { CreateDataSourceDto } from "@dto/data-source.dto";
import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { isEmpty } from "lodash";
import { Organization } from "src/entities/organization.entity";
import { EntityManager } from "typeorm";
import * as crypto from "crypto";
import { DataSourcesService } from "./data_sources.service";
import { DataSource } from "src/entities/data_source.entity";

@Injectable()
export class WorkspaceDbSetupService {
  constructor(
    private readonly configService: ConfigService,
    private readonly dataSourcesService: DataSourcesService
  ) { }

  async perform(manager: EntityManager, organizationId: string): Promise<DataSource> {
    // validate if db already exists
    await this.validateOrgExists(manager, organizationId);
    return await this.setupWorkspaceDb(manager, organizationId);
  }

  async validateOrgExists(manager: EntityManager, organizationId: string) {
    const isOrgEmpty = (await this.isOrgEmpty(manager, organizationId))
    if (isEmpty(organizationId) || isOrgEmpty) {
      throw new BadRequestException(
        "Organization not found" + " " + organizationId
      );
    }
  }

  async isOrgEmpty(manager: EntityManager, organizationId: string): Promise<boolean> {
    const organization = await manager.findOne(Organization, {
      where: { id: organizationId },
    });
    return !!isEmpty(organization);
  }

  async setupWorkspaceDb(manager: EntityManager, organizationId: string): Promise<DataSource> {
    const dbUser = `user_${organizationId}`;
    const dbName = `workspace_${organizationId}_1`;
    const dbPassword = crypto.randomBytes(8).toString("hex")
    this.createDbUser(dbUser, dbPassword, manager);
    this.createWorkspaceDb(dbName, dbUser, manager);
    return await this.addWorkspaceDbToDataSource(dbUser, dbPassword, dbName, organizationId, manager);
  }

  async addWorkspaceDbToDataSource(
    dbUser: string,
    dbPassword: string,
    dbName: string,
    organizationId: string,
    manager: EntityManager
  ): Promise<DataSource> {

    const dto: CreateDataSourceDto = {
      app_id: null,
      app_version_id: null,
      organization_id: organizationId,
      kind: "tooljetdb",
      name: "ToolJet DB",
      options: [
        {
          key: "host",
          value: this.configService.get<string>("PG_HOST"),
        },
        {
          key: "port",
          value: this.configService.get<string>("PG_PORT") || 5432,
        },
        {
          key: "database",
          value: dbName,
        },
        {
          key: "username",
          value: dbUser,
        },
        {
          encrypted: true,
          key: "password",
          value: dbPassword,
        },
        {
          encrypted: false,
          key: "ssl_enabled",
          value: false,
        },
        {
          encrypted: false,
          key: "ssl_certificate",
          value: "none",
        },
      ],
    };

    console.log(dto.options)
    const workspaceDb = await this.dataSourcesService.create(
      dto.name,
      dto.kind,
      dto.options,
      dto.app_id,
      dto.app_version_id,
      dto.organization_id,
      manager
    );

    return workspaceDb;
  }

  async createDbUser(username: string, password: string, manager: EntityManager): Promise<void> {
    await manager.query(`CREATE ROLE "${username}" WITH LOGIN NOCREATEDB PASSWORD '${password}'`);
  }

  async createWorkspaceDb(dbName: string, dbUser: string, manager: EntityManager): Promise<void> {
    await manager.query(
      `CREATE DATABASE "${dbName}" WITH OWNER "${dbUser}";`
    );
  }
}
