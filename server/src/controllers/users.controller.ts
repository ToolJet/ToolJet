import { Body, Controller, Post, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/jwt-auth.guard';
import { PasswordRevalidateGuard } from 'src/modules/auth/password-revalidate.guard';
import { UsersService } from 'src/services/users.service';
import { User } from 'src/decorators/user.decorator';
import { MultiOrganizationGuard } from 'src/modules/auth/multi-organization.guard';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(MultiOrganizationGuard)
  @Post('set_password_from_token')
  async create(@Body() body) {
    await this.usersService.setupAccountFromInvitationToken(body);
    return {};
  }

  @Post('accept-invite')
  async acceptInvite(@Body() body) {
    await this.usersService.acceptOrganizationInvite(body);
    return {};
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
