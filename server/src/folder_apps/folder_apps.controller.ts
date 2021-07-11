import { Controller, Post, Request, UseGuards } from '@nestjs/common';
import { decamelizeKeys } from 'humps';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { FolderAppsService } from './folder_apps.service';

@Controller('folder_apps')
export class FolderAppsController {
  constructor(
    private folderAppsService: FolderAppsService
  ) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req) {
    const folderId = req.body.folder_id;
    const appId =  req.body.app_id;

    const folder = await this.folderAppsService.create(req.user, folderId, appId);
    return decamelizeKeys(folder);
  }

}
