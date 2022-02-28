import { Controller, Param, Post, Put, Request, UseGuards } from '@nestjs/common';
import { decamelizeKeys } from 'humps';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { FolderAppsService } from '../services/folder_apps.service';

@Controller('folder_apps')
export class FolderAppsController {
  constructor(private folderAppsService: FolderAppsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req) {
    const folderId = req.body.folder_id;
    const appId = req.body.app_id;

    const folder = await this.folderAppsService.create(folderId, appId);
    return decamelizeKeys(folder);
  }

  @UseGuards(JwtAuthGuard)
  @Put('/:folderId')
  async remove(@Request() req, @Param('folderId') folderId: string) {
    const appId = req.body.app_id;

    await this.folderAppsService.remove(folderId, appId);
  }
}
