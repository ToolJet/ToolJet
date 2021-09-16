/* eslint-disable @typescript-eslint/no-var-requires */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Metadata } from 'src/entities/metadata.entity';
import { gt } from 'semver';
// import got from 'got';
const got = require('got');
@Injectable()
export class MetadataService {
  constructor(
    @InjectRepository(Metadata)
    private metadataRepository: Repository<Metadata>
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

  async finishInstallation(installedVersion: string, name: string, email: string) {
    return await got('https://hub.tooljet.io/updates', {
      method: 'post',
      json: {
        installed_version: installedVersion,
        name,
        email,
      },
    });
  }

  async checkForUpdates(installedVersion: string, ignoredVersion: string) {
    const response = await got('https://hub.tooljet.io/updates', {
      method: 'post',
      json: { installed_version: installedVersion },
    });

    const data = JSON.parse(response.body);
    const latestVersion = data['latest_version'];

    const newOptions = {
      last_checked: new Date(),
    };

    if (gt(latestVersion, installedVersion) && installedVersion !== ignoredVersion) {
      newOptions['latest_version'] = latestVersion;
      newOptions['version_ignored'] = false;
    }

    await this.updateMetaData(newOptions);

    return { latestVersion };
  }
}
