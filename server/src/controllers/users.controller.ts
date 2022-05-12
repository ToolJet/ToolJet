import { Body, Controller, Post, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/jwt-auth.guard';
import { PasswordRevalidateGuard } from 'src/modules/auth/password-revalidate.guard';
import { UsersService } from 'src/services/users.service';
import { User } from 'src/decorators/user.decorator';
import { MultiOrganizationGuard } from 'src/modules/auth/multi-organization.guard';
import { SignupDisableGuard } from 'src/modules/auth/signup-disable.guard';
import { CreateUserDto, UpdateUserDto } from '@dto/user.dto';
import { AcceptInviteDto } from '@dto/accept-organization-invite.dto';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(MultiOrganizationGuard, SignupDisableGuard)
  @Post('set_password_from_token')
  async create(@Body() userCreateDto: CreateUserDto) {
    await this.usersService.setupAccountFromInvitationToken(userCreateDto);
    return {};
  }

  @Post('accept-invite')
  async acceptInvite(@Body() acceptInviteDto: AcceptInviteDto) {
    await this.usersService.acceptOrganizationInvite(acceptInviteDto);
    return {};
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update')
  async update(@User() user, @Body() updateUserDto: UpdateUserDto) {
    const { first_name: firstName, last_name: lastName } = updateUserDto;
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
    return await this.usersService.update(user.id, {
      password: newPassword,
    });
  }
}
