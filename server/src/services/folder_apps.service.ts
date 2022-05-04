import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FolderApp } from '../../src/entities/folder_app.entity';

@Injectable()
export class FolderAppsService {
  constructor(
    @InjectRepository(FolderApp)
    private folderAppsRepository: Repository<FolderApp>
  ) {}

  async create(folderId: string, appId: string): Promise<FolderApp> {
    const existingFolderApp = await this.folderAppsRepository.findOne({
      where: { appId, folderId },
    });

    if (existingFolderApp) {
      throw new BadRequestException('App has been already added to the folder');
    }

    const newFolderApp = this.folderAppsRepository.create({
      folderId,
      appId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const folderApp = await this.folderAppsRepository.save(newFolderApp);

    return folderApp;
  }

  async remove(folderId: string, appId: string): Promise<void> {
    await this.folderAppsRepository.delete({ folderId, appId });
  }
}
