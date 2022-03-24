import { Body, Controller, Post, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/jwt-auth.guard';
import { PasswordRevalidateGuard } from 'src/modules/auth/password-revalidate.guard';
import { UsersService } from 'src/services/users.service';
import { User } from 'src/decorators/user.decorator';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('set_password_from_token')
  async create(@Body() body) {
    const result = await this.usersService.setupAccountFromInvitationToken(body);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update')
  async update(@User() user, @Body('firstName') firstName, @Body('lastName') lastName) {
    await this.usersService.update(user.id, { firstName, lastName });
    await user.reload();
    return {
      first_name: user.firstName,
      last_name: user.lastName,
    };
  }

  @UseGuards(JwtAuthGuard, PasswordRevalidateGuard)
  @Patch('change_password')
  async changePassword(@User() user, @Body('newPassword') newPassword) {
    return await this.usersService.update(user.id, { password: newPassword });
  }
}
