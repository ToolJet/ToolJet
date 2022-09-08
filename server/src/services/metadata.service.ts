import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getManager, Repository } from 'typeorm';
import { Metadata } from 'src/entities/metadata.entity';
import { gt } from 'semver';
import got from 'got';
import { User } from 'src/entities/user.entity';
import { UsersService } from '@services/users.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MetadataService {
  constructor(
    @InjectRepository(Metadata)
    private metadataRepository: Repository<Metadata>,
    private configService: ConfigService,
    private usersService: UsersService
  ) {}

  async getMetaData() {
    let metadata = await this.metadataRepository.findOne({});

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
    const metadata = await this.metadataRepository.findOne({});

    return await this.metadataRepository.update(metadata.id, {
      data: { ...metadata.data, ...newOptions },
    });
  }

  async finishInstallation(metadata: any, installedVersion: string, name: string, email: string, org: string) {
    return await got('https://hub.tooljet.io/subscribe', {
      method: 'post',
      json: {
        id: metadata.id,
        installed_version: installedVersion,
        name,
        email,
        org,
      },
    });
  }

  async sendTelemetryData(metadata: Metadata) {
    const manager = getManager();
    const totalUserCount = await manager.count(User);
    const { editor: totalEditorCount, viewer: totalViewerCount } = await this.usersService.fetchTotalViewerEditorCount(
      manager
    );

    return await got('https://hub.tooljet.io/telemetry', {
      method: 'post',
      json: {
        id: metadata.id,
        total_users: totalUserCount,
        total_editors: totalEditorCount,
        total_viewers: totalViewerCount,
        tooljet_version: globalThis.TOOLJET_VERSION,
        deployment_platform: this.configService.get<string>('DEPLOYMENT_PLATFORM'),
      },
    });
  }

  async checkForUpdates(metadata: Metadata) {
    const installedVersion = globalThis.TOOLJET_VERSION;
    const response = await got('https://hub.tooljet.io/updates', {
      method: 'post',
    });
    const data = JSON.parse(response.body);
    const latestVersion = data['latest_version'];

    const newOptions = {
      last_checked: new Date(),
    };

    if (gt(latestVersion, installedVersion) && installedVersion !== metadata.data['ignored_version']) {
      newOptions['latest_version'] = latestVersion;
      newOptions['version_ignored'] = false;
    }

    await this.updateMetaData(newOptions);
    return { latestVersion };
  }
}
