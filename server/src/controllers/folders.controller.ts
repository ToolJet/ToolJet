import { Controller, Get, Post, Query, Request, UseGuards, Body, Delete, Param, Put } from '@nestjs/common';
import { decamelizeKeys } from 'humps';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { FoldersService } from '../services/folders.service';
import { ForbiddenException } from '@nestjs/common';
import { FoldersAbilityFactory } from 'src/modules/casl/abilities/folders-ability.factory';
import { Folder } from 'src/entities/folder.entity';
import { CreateFolderDto } from '@dto/create-folder.dto';
import { User } from 'src/decorators/user.decorator';

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
  async create(@Request() req, @Body() createFolderDto: CreateFolderDto) {
    const ability = await this.foldersAbilityFactory.folderActions(req.user, {});

    if (!ability.can('createFolder', Folder)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }
    const folder = await this.foldersService.create(req.user, createFolderDto.name);
    return decamelizeKeys(folder);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@User() user, @Param('id') id, @Body() createFolderDto: CreateFolderDto) {
    const ability = await this.foldersAbilityFactory.folderActions(user, {});

    if (!ability.can('updateFolder', Folder)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    const folder = await this.foldersService.update(id, createFolderDto.name);
    return decamelizeKeys(folder);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@User() user, @Param('id') id) {
    const ability = await this.foldersAbilityFactory.folderActions(user, {});

    if (!ability.can('deleteFolder', Folder)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    return await this.foldersService.delete(user, id);
  }
}
