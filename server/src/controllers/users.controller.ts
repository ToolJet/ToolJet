import { Body, Controller, Post, Patch, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/jwt-auth.guard';
import { PasswordRevalidateGuard } from 'src/modules/auth/password-revalidate.guard';
import { UsersService } from 'src/services/users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('set_password_from_token')
  async create(@Request() req) {
    const result = await this.usersService.setupAccountFromInvitationToken(req.body);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update')
  async update(@Request() req, @Body() body) {
    const { firstName, lastName } = body;
    await this.usersService.update(req.user.id, { firstName, lastName });
    await req.user.reload();
    return {
      first_name: req.user.firstName,
      last_name: req.user.lastName,
    };
  }

  @UseGuards(JwtAuthGuard, PasswordRevalidateGuard)
  @Patch('change_password')
  async changePassword(@Request() req, @Body() body) {
    const { newPassword } = body;
    return await this.usersService.update(req.user.id, {
      password: newPassword,
    });
  }
}
