import { Injectable, BadRequestException } from '@nestjs/common';
import { Folder } from '@entities/folder.entity';
import { FolderApp } from '../../entities/folder_app.entity';
import { AppGitSync } from '../../entities/app_git_sync.entity';
import { decamelizeKeys } from 'humps';
import { CreateFolderDto, UpdateFolderDto } from '@modules/folders/dto';
import { IFoldersService } from './interfaces/IService';
import { catchDbException } from '@helpers/utils.helper';
import { DeleteResult } from 'typeorm';
import { DataBaseConstraints } from '@helpers/db_constraints.constants';
import { dbTransactionWrap } from '@helpers/database.helper';
import { EntityManager } from 'typeorm';
import { FoldersUtilService } from './util.service';
import { BranchContextService } from '@modules/workspace-branches/branch-context.service';
import { FolderBranchEntry } from '@entities/folder_branch_entry.entity';
@Injectable()
export class FoldersService implements IFoldersService {
  constructor(
    protected foldersUtilService: FoldersUtilService,
    protected readonly branchContextService: BranchContextService
  ) {}
  async createFolder(user, createFolderDto: CreateFolderDto) {
    return this.foldersUtilService.createFolder(user, createFolderDto);
  }
  async updateFolder(user, id, updateFolderDto: UpdateFolderDto) {
    const folderId = id;
    const folderName = updateFolderDto.name;
    return dbTransactionWrap(async (manager: EntityManager) => {
      const gitSyncedAppInFolder = await manager
        .createQueryBuilder(AppGitSync, 'ags')
        .innerJoin(FolderApp, 'fa', 'fa.app_id = ags.app_id')
        .where('fa.folder_id = :folderId', { folderId })
        .select('ags.id')
        .getOne();

      if (gitSyncedAppInFolder) {
        throw new BadRequestException('Folders with git-synced apps cannot be edited');
      }

      // Branch-aware: update override name on FolderBranchEntry if branch active
      const branchId = await this.branchContextService.getActiveBranchId(user.organizationId);
      if (branchId) {
        let fbe = await manager.findOne(FolderBranchEntry, {
          where: { folderId, branchId },
        });
        if (!fbe) {
          fbe = manager.create(FolderBranchEntry, {
            folderId,
            branchId,
            isActive: true,
            name: folderName,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          await manager.save(FolderBranchEntry, fbe);
        } else {
          await manager.update(FolderBranchEntry, { id: fbe.id }, { name: folderName, updatedAt: new Date() });
        }
        return decamelizeKeys({ raw: [], affected: 1 });
      }

      const folder = await catchDbException(async () => {
        return manager.update(Folder, { id: folderId }, { name: folderName });
      }, [
        {
          dbConstraint: DataBaseConstraints.FOLDER_NAME_UNIQUE,
          message: 'This folder name is already taken.',
        },
      ]);
      return decamelizeKeys(folder);
    });
  }
  async deleteFolder(user, id): Promise<DeleteResult> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const folder = await manager.findOneOrFail(Folder, {
        where: { id, organizationId: user.organizationId },
      });

      // Branch-aware: soft-delete via FolderBranchEntry.isActive = false
      const branchId = await this.branchContextService.getActiveBranchId(user.organizationId);
      if (branchId) {
        let fbe = await manager.findOne(FolderBranchEntry, {
          where: { folderId: folder.id, branchId },
        });
        if (!fbe) {
          fbe = manager.create(FolderBranchEntry, {
            folderId: folder.id,
            branchId,
            isActive: false,
            name: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          await manager.save(FolderBranchEntry, fbe);
        } else {
          await manager.update(FolderBranchEntry, { id: fbe.id }, { isActive: false, updatedAt: new Date() });
        }
        return { raw: [], affected: 1 } as DeleteResult;
      }

      const gitSyncedAppInFolder = await manager
        .createQueryBuilder(AppGitSync, 'ags')
        .innerJoin(FolderApp, 'fa', 'fa.app_id = ags.app_id')
        .where('fa.folder_id = :folderId', { folderId: folder.id })
        .select('ags.id')
        .getOne();

      if (gitSyncedAppInFolder) {
        throw new BadRequestException(
          "Folders with apps synced to git can't be deleted. Delete the git apps and try again."
        );
      }

      return manager.delete(Folder, { id: folder.id, organizationId: user.organizationId });
    });
  }
}
