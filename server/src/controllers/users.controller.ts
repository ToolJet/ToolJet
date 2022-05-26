import { Body, Controller, Post, Patch, Request, UseGuards, Get } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/jwt-auth.guard';
import { PasswordRevalidateGuard } from 'src/modules/auth/password-revalidate.guard';
import { UsersService } from 'src/services/users.service';
import { User } from 'src/decorators/user.decorator';
import { User as UserEntity } from 'src/entities/user.entity';
import { SignupDisableGuard } from 'src/modules/auth/signup-disable.guard';
import { CreateUserDto, UpdateUserDto } from '@dto/user.dto';
import { CheckPolicies } from 'src/modules/casl/check_policies.decorator';
import { PoliciesGuard } from 'src/modules/casl/policies.guard';
import { AppAbility } from 'src/modules/casl/casl-ability.factory';
import { decamelizeKeys } from 'humps';
import { AcceptInviteDto } from '@dto/accept-organization-invite.dto';
import { MultiOrganizationGuard } from 'src/modules/auth/multi-organization.guard';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(MultiOrganizationGuard, SignupDisableGuard)
  @Post('set_password_from_token')
  async create(@Request() req, @Body() userCreateDto: CreateUserDto) {
    await this.usersService.setupAccountFromInvitationToken(req, userCreateDto);
    return {};
  }

  @Post('accept-invite')
  async acceptInvite(@Request() req, @Body() acceptInviteDto: AcceptInviteDto) {
    await this.usersService.acceptOrganizationInvite(req, acceptInviteDto);
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

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('fetchAllUsers', UserEntity))
  @Get()
  async index(@Request() req) {
    const users = await this.usersService.findAll(req.user.organizationId);
    return decamelizeKeys({ users });
  }
}
