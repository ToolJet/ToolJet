import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Metadata } from 'src/entities/metadata.entity';
import got from 'got';
import { User } from 'src/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { InternalTable } from 'src/entities/internal_table.entity';
import { App } from 'src/entities/app.entity';
import { DataSource } from 'src/entities/data_source.entity';
import { LicenseCountsService } from '@modules/licensing/services/count.service';
import License from '@modules/licensing/configs/License';
import { MetadataType } from './types';
import { IMetaUtilService } from './interfaces/IUtilService';
import { dbTransactionWrap } from '@helpers/database.helper';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
@Injectable()
export class MetadataUtilService implements IMetaUtilService {
  constructor(
    protected configService: ConfigService,
    protected licenseTermsService: LicenseTermsService,
    protected licenseCountsService: LicenseCountsService
  ) {}

  async getMetaData() {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      let [metadata] = await manager.find(Metadata);
      if (!metadata) {
        metadata = manager.create(Metadata, {
          data: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        metadata = await manager.save(metadata);
      }
      return metadata;
    });
  }
  protected async updateMetaData(newOptions: MetadataType) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const [metadata] = await manager.find(Metadata);
      if (!metadata) {
        throw new Error('Metadata not found');
      }
      return await manager.update(Metadata, metadata.id, {
        data: { ...metadata.data, ...newOptions },
      });
    });
  }
  async finishOnboarding({
    name,
    email,
    companyName,
    region,
  }: {
    name: string;
    email: string;
    companyName: string;
    region: string;
  }) {
    if (this.configService.get('NODE_ENV') == 'production') {
      const metadata = await this.getMetaData();
      const params = {
        name: name,
        email: email,
        org: companyName,
        region: region,
        metadata: metadata,
      };
      void this.finishInstallation(params);

      await this.updateMetaData({
        onboarded: true,
      });
    }
  }

  async saveMetadataToDB(metadataDto: MetadataType) {
    if (this.configService.get('NODE_ENV') == 'production') {
      /* to create metadata record with empty data object */
      await this.getMetaData();
      await this.updateMetaData(metadataDto);
    }
  }
  async fetchMetadata() {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const [metadata] = await manager.find(Metadata);
      const data = {
        ...(metadata?.data && metadata.data),
        createdAt: metadata?.createdAt,
      };
      return data;
    });
  }

  async finishInstallation(params: {
    name: string;
    email: string;
    org: string;
    region: string;
    companySize?: string;
    role?: string;
    metadata?: Metadata;
  }): Promise<any> {
    const { name, email, org, region, companySize, role, metadata } = params;
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
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const totalUserCount = await manager.count(User);
      const { editor: totalEditorCount, viewer: totalViewerCount } =
        await this.licenseCountsService.fetchTotalViewerEditorCount(manager);
      const totalAppCount = await manager.count(App);
      const totalInternalTableCount = await manager.count(InternalTable);
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
            license_info: License.Instance()?.terms,
          },
        });
      } catch (error) {
        console.error('Error while connecting to URL https://hub.tooljet.io/telemetry', error);
      }
    });
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
