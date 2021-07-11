import { Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { decamelizeKeys } from 'humps';
import { JwtAuthGuard } from 'src/modules/auth/jwt-auth.guard';
import { FoldersService } from '../services/folders.service';

@Controller('folders')
export class FoldersController {
  constructor(
    private foldersService: FoldersService
  ) { }

  @UseGuards(JwtAuthGuard)
  @Get()
  async index(@Request() req, @Query() query) {

    const folders = await this.foldersService.all(req.user);

    return decamelizeKeys({ folders });
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req) {
    const folderName = req.body.name;
    
    const folder = await this.foldersService.create(req.user, folderName);
    return decamelizeKeys(folder);
  }

}
