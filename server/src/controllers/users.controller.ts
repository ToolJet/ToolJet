import {
  Body,
  Controller,
  Post,
  Patch,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { Express } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/modules/auth/jwt-auth.guard';
import { PasswordRevalidateGuard } from 'src/modules/auth/password-revalidate.guard';
import { UsersService } from 'src/services/users.service';
import { User } from 'src/decorators/user.decorator';
import { UpdateUserDto } from '@dto/user.dto';
import { ChangePasswordDto } from '@dto/app-authentication.dto';

const MAX_AVATAR_FILE_SIZE = 1024 * 1024 * 2; // 2MB

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

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

  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async addAvatar(@User() user, @UploadedFile() file: Express.Multer.File) {
    // TODO: use ParseFilePipe to validate file size from nestjs v9
    if (file.size > MAX_AVATAR_FILE_SIZE) {
      throw new BadRequestException('File size is greater than 2MB');
    }
    return this.usersService.addAvatar(user.id, file.buffer, file.originalname);
  }

  @UseGuards(JwtAuthGuard, PasswordRevalidateGuard)
  @Patch('change_password')
  async changePassword(@User() user, @Body() changePasswordDto: ChangePasswordDto) {
    return await this.usersService.update(user.id, {
      password: changePasswordDto.newPassword,
    });
  }
}
