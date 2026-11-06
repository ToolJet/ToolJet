import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { App } from '@entities/app.entity';
import { User } from '@entities/user.entity';
import { AppVersionUpdateDto } from '@dto/app-version-update.dto';

/*
  CE stub; the implementation lives in ee/code-mode-source/. Other modules call these hooks around app creation,
  release and version save and copy; here they do nothing beyond refusing a build mode this edition does not have.
*/
@Injectable()
export class CodeModeSourceService {
  /** Creates the app through `create`, for the build mode the request asked for. */
  async createApp<T>(user: User, buildMode: string | undefined, create: () => Promise<T>): Promise<T> {
    if (buildMode && buildMode !== 'visual') throw new BadRequestException('This build mode is not available.');
    return create();
  }

  /** Throws when the version may not be released as it is. */
  async assertReleasable(_app: App, _versionId: string): Promise<void> {
    return;
  }

  /** Before a version update is saved. What it returns is handed to afterVersionUpdate; null for nothing to do. */
  async beforeVersionUpdate(_app: App, _user: User, _dto: AppVersionUpdateDto): Promise<unknown | null> {
    return null;
  }

  /** After a version update was saved, with what beforeVersionUpdate returned. Never fails the update. */
  afterVersionUpdate(_app: App, _user: User, _versionId: string, _state: unknown): void {
    return;
  }

  /** Inside the transaction that copies a version: the new version's pages map from the old ones by id. */
  async afterVersionCopied(
    _manager: EntityManager,
    _fromVersionId: string,
    _toVersionId: string,
    _pageMapping: Record<string, string>
  ): Promise<void> {
    return;
  }
}
