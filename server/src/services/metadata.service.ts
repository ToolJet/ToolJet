import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository, DataSource as TypeORMDatasource } from 'typeorm';
import { Metadata } from 'src/entities/metadata.entity';
import { gt } from 'semver';
import got from 'got';
import { User } from 'src/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { InternalTable } from 'src/entities/internal_table.entity';
import { App } from 'src/entities/app.entity';
import { DataSource } from 'src/entities/data_source.entity';
import {
  GROUP_PERMISSIONS_TYPE,
  USER_ROLE,
} from '@modules/user_resource_permissions/constants/group-permissions.constant';

@Injectable()
export class MetadataService {
  constructor(
    @InjectRepository(Metadata)
    private metadataRepository: Repository<Metadata>,
    private configService: ConfigService,
    private readonly _dataSource: TypeORMDatasource
  ) {}

  async getMetaData() {
    let [metadata] = await this.metadataRepository.find();

    if (!metadata) {
      metadata = await this.metadataRepository.save(
        this.metadataRepository.create({
          data: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );
    }

    return metadata;
  }

  async updateMetaData(newOptions: any) {
    const [metadata] = await this.metadataRepository.find();

    return await this.metadataRepository.update(metadata.id, {
      data: { ...metadata.data, ...newOptions },
    });
  }

  async finishOnboarding(name, email, companyName, companySize, role) {
    if (process.env.NODE_ENV == 'production') {
      const metadata = await this.getMetaData();
      void this.finishInstallation(name, email, companyName, null, companySize, role, metadata);

      await this.updateMetaData({
        onboarded: true,
      });
    }
  }

  async finishOnboardingCE(name: string, email: string, companyName: string, region: string) {
    if (process.env.NODE_ENV == 'production') {
      const metadata = await this.getMetaData();
      void this.finishInstallation(name, email, companyName, region, null, null, metadata);

      await this.updateMetaData({
        onboarded: true,
      });
    }
  }

  async finishInstallation(
    name: string,
    email: string,
    org: string,
    region: string,
    companySize?: string,
    role?: string,
    metadata?: Metadata
  ) {
    try {
      return await got('https://hub.tooljet.io/subscribe', {
        method: 'post',
        json: {
          id: metadata.id,
          installed_version: globalThis.TOOLJET_VERSION,
          name,
          email,
          org,
          companySize,
          role,
          region,
        },
      });
    } catch (error) {
      console.error('Error while connecting to URL https://hub.tooljet.io/subscribe', error);
    }
  }

  async sendTelemetryData(metadata: Metadata) {
    const manager = this._dataSource.manager;
    const totalUserCount = await manager.count(User);
    const totalAppCount = await manager.count(App);
    const totalInternalTableCount = await manager.count(InternalTable);
    const totalEditorCount = await this.fetchTotalEditorCount(manager);
    const totalViewerCount = await this.fetchTotalViewerCount(manager);
    const totalDatasourcesByKindCount = await this.fetchDatasourcesByKindCount(manager);

    try {
      return await got('https://hub.tooljet.io/telemetry', {
        method: 'post',
        json: {
          id: metadata.id,
          total_users: totalUserCount,
          total_editors: totalEditorCount,
          total_viewers: totalViewerCount,
          total_apps: totalAppCount,
          tooljet_db_table_count: totalInternalTableCount,
          tooljet_version: globalThis.TOOLJET_VERSION,
          data_sources_count: totalDatasourcesByKindCount,
          deployment_platform: this.configService.get<string>('DEPLOYMENT_PLATFORM'),
        },
      });
    } catch (error) {
      console.error('Error while connecting to URL https://hub.tooljet.io/telemetry', error);
    }
  }

  async checkForUpdates(metadata: Metadata) {
    const installedVersion = globalThis.TOOLJET_VERSION;
    let latestVersion;

    try {
      const response = await got('https://hub.tooljet.io/updates', {
        method: 'post',
      });
      const data = JSON.parse(response.body);
      latestVersion = data['latest_version'];

      const newOptions = {
        last_checked: new Date(),
      };

      if (gt(latestVersion, installedVersion) && installedVersion !== metadata.data['ignored_version']) {
        newOptions['latest_version'] = latestVersion;
        newOptions['version_ignored'] = false;
      }

      await this.updateMetaData(newOptions);
    } catch (error) {
      console.error('Error while connecting to URL https://hub.tooljet.io/updates', error);
    }
    return { latestVersion: latestVersion || installedVersion };
  }

  async fetchTotalEditorCount(manager: EntityManager) {
    const userIdsWithEditPermissions = (
      await manager
        .createQueryBuilder(User, 'users')
        .innerJoin('users.userPermissions', 'userPermissions', 'userPermissions.type = :type', {
          type: GROUP_PERMISSIONS_TYPE.DEFAULT,
        })
        .where('userPermissions.name = :role', {
          role: USER_ROLE.BUILDER,
        })
        .orWhere('userPermissions.name = :role', {
          role: USER_ROLE.ADMIN,
        })
        .select('users.id')
        .distinct()
        .getMany()
    ).map((record) => record.id);

    const userIdsOfAppOwners = (
      await this._dataSource
        .createQueryBuilder(User, 'users')
        .innerJoin('users.apps', 'apps')
        .select('users.id')
        .distinct()
        .getMany()
    ).map((record) => record.id);

    const totalEditorCount = await manager.count(User, {
      where: { id: In([...userIdsWithEditPermissions, ...userIdsOfAppOwners]) },
    });

    return totalEditorCount;
  }

  //change as per new permissions
  async fetchTotalViewerCount(manager: EntityManager) {
    return await manager
      .createQueryBuilder(User, 'users')
      .innerJoin('users.userPermissions', 'userPermissions', 'userPermissions.type = :type', {
        type: GROUP_PERMISSIONS_TYPE.DEFAULT,
      })
      .where('userPermissions.name = :role', {
        role: USER_ROLE.END_USER,
      })
      .select('users.id')
      .distinct()
      .getCount();
  }

  async fetchDatasourcesByKindCount(manager: EntityManager) {
    const dsGroupedByKind = await manager
      .createQueryBuilder(DataSource, 'data_sources')
      .select('kind')
      .addSelect('COUNT(*)', 'count')
      .groupBy('kind')
      .getRawMany();

    return dsGroupedByKind.reduce((acc, { kind, count }) => {
      acc[kind] = count;
      return acc;
    }, {});
  }
}
