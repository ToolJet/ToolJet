import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../src/entities/user.entity';
import { FolderApp } from '../../src/entities/folder_app.entity';

@Injectable()
export class FolderAppsService {

  constructor(
    @InjectRepository(FolderApp)
    private folderAppsRepository: Repository<FolderApp>,
  ) { }

  async create(user: User, folderId: string, appId: string): Promise<FolderApp> {

    const newFolderApp = this.folderAppsRepository.create({
      folderId,
      appId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const folderApp = await this.folderAppsRepository.save(newFolderApp);

    return folderApp;
  }
}
