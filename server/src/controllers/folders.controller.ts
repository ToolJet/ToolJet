import { Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { decamelizeKeys } from 'humps';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { FoldersService } from '../services/folders.service';
import { ForbiddenException } from '@nestjs/common';
import { FoldersAbilityFactory } from 'src/modules/casl/abilities/folders-ability.factory';
import { Folder } from 'src/entities/folder.entity';

@Controller('folders')
export class FoldersController {
  constructor(private foldersService: FoldersService, private foldersAbilityFactory: FoldersAbilityFactory) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async index(@Request() req, @Query() query) {
    const folders = await this.foldersService.all(req.user, query.searchKey);
    return decamelizeKeys({ folders });
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req) {
    const ability = await this.foldersAbilityFactory.folderActions(req.user, {});

    if (!ability.can('createFolder', Folder)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }
    const folderName = req.body.name;

    const folder = await this.foldersService.create(req.user, folderName);
    return decamelizeKeys(folder);
  }
}
