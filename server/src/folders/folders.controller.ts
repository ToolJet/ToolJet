import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { decamelizeKeys } from 'humps';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { FoldersService } from './folders.service';

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

}
