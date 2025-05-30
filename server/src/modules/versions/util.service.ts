import { AppVersion } from '@entities/app_version.entity';
import { VersionRepository } from './repository';
import { AppVersionUpdateDto } from '@dto/app-version-update.dto';
import { Injectable } from '@nestjs/common';
import { IVersionUtilService } from './interfaces/IUtilService';

@Injectable()
export class VersionUtilService implements IVersionUtilService {
  constructor(protected readonly versionRepository: VersionRepository) {}
  protected mergeDeep(target, source, seen = new WeakMap()) {
    if (!this.isObject(target)) {
      target = {};
    }

    if (!this.isObject(source)) {
      return target;
    }

    if (seen.has(source)) {
      return seen.get(source);
    }
    seen.set(source, target);

    for (const key in source) {
      if (this.isObject(source[key])) {
        if (!target[key]) {
          Object.assign(target, { [key]: {} });
        }
        this.mergeDeep(target[key], source[key], seen);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }

    return target;
  }

  protected isObject(obj) {
    return obj && typeof obj === 'object';
  }

  async updateVersion(appVersion: AppVersion, appVersionUpdateDto: AppVersionUpdateDto) {
    const editableParams = {};

    const { globalSettings, homePageId, pageSettings, name } = appVersion;

    if (appVersionUpdateDto?.homePageId && homePageId !== appVersionUpdateDto.homePageId) {
      editableParams['homePageId'] = appVersionUpdateDto.homePageId;
    }

    if (appVersionUpdateDto?.globalSettings) {
      editableParams['globalSettings'] = {
        ...globalSettings,
        ...appVersionUpdateDto.globalSettings,
      };
    }

    if (appVersionUpdateDto?.pageSettings) {
      editableParams['pageSettings'] = {
        ...this.mergeDeep(pageSettings, appVersionUpdateDto.pageSettings),
      };
    }

    if (typeof appVersionUpdateDto?.showViewerNavigation === 'boolean') {
      editableParams['showViewerNavigation'] = appVersionUpdateDto.showViewerNavigation;
    }

    if (appVersionUpdateDto?.name && name !== appVersionUpdateDto.name) {
      editableParams['name'] = appVersionUpdateDto.name;
    }

    await this.versionRepository.update(appVersion.id, editableParams);
    return;
  }

  async fetchVersions(appId: string): Promise<AppVersion[]> {
    return await this.versionRepository.find({
      where: { appId },
      order: {
        createdAt: 'DESC',
      },
    });
  }
}
