import { Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { UsersService } from 'src/services/users.service';

@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService
  ) { }

  @Post('set_password_from_token')
  async create(@Request() req) {
    const result = await this.usersService.setupAccountFromInvitationToken(req.body);
    return result;
  }

}
