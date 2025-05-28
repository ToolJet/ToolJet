import { AppVersion } from '@entities/app_version.entity';
import { VersionRepository } from './repository';
import { AppVersionUpdateDto } from '@dto/app-version-update.dto';
import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { IVersionUtilService } from './interfaces/IUtilService';
import { dbTransactionWrap } from '@helpers/database.helper';
import { EntityManager } from 'typeorm';
import { App } from '@entities/app.entity';
import { User } from '@entities/user.entity';
import { RenameAppOrVersionDto } from '@modules/app-git/dto';
import { RequestContext } from '@modules/request-context/service';
import got from 'got';

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

  async deleteVersion(app: App, user: User, manager?: EntityManager): Promise<void> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const numVersions = await this.versionRepository.getCount(app.id);

      if (numVersions <= 1) {
        throw new ForbiddenException('Cannot delete only version of app');
      }

      if (app.currentVersionId === app.appVersions[0].id) {
        throw new BadRequestException('You cannot delete a released version');
      }

      await this.versionRepository.deleteById(app.appVersions[0].id, manager);

      // TODO: Add audit logs
      return;
    }, manager);
  }
  async deleteVersionGit(app: App, user: User, manager?: EntityManager): Promise<void> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      if (app.currentVersionId && app.currentVersionId === app.appVersions[0].id) {
        throw new BadRequestException('You cannot delete a released version');
      }

      await this.versionRepository.deleteById(app.appVersions[0].id, manager);

      // TODO: Add audit logs
      return;
    }, manager);
  }
  async handleVersionRenameCommit(appId: string, appVersion: AppVersion, appVersionUpdateDto: AppVersionUpdateDto) {
    const prevName = appVersion.name;
    const renameAppDto = new RenameAppOrVersionDto();
    renameAppDto.prevName = appVersion.name;
    renameAppDto.updatedName = appVersionUpdateDto.name;
    const request = RequestContext.getRequest();
    const { name } = appVersionUpdateDto;
    if (name && name != prevName) {
      const headers = {
        'Content-Type': 'application/json',
        Cookie: request.headers['cookie'],
        'tj-workspace-id': request.headers['tj-workspace-id'],
      };
      const host = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : process.env.TOOLJET_HOST;
      const renameAppDto = new RenameAppOrVersionDto();
      renameAppDto.prevName = prevName;
      renameAppDto.updatedName = name;
      renameAppDto.renameVersionFlag = true;
      // TO DO : Review if we can make it asynchronous
      try {
        await got.put(`${host}/api/app-git/app/${appId}/rename`, {
          json: renameAppDto,
          headers,
          responseType: 'json',
        });
      } catch (err) {
        console.log('Version rename commit failed with error', err);
        // Don't throw the error here as this failure is related to the commit, but the version rename itself has been successful.
        // This ensures the rest of the process continues, even though the commit may have failed
      }
    }
  }
}
