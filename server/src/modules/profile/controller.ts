import {
  Body,
  Controller,
  Patch,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { User, UserEntity } from '@modules/app/decorators/user.decorator';
import { ChangePasswordDto } from '@modules/users/dto';
import { ProfileService } from '@modules/profile/service';
import { ProfileUpdateDto } from './dto';
import { IProfileController } from './interfaces/IController';
import { FEATURE_KEY, MAX_AVATAR_FILE_SIZE } from './constants';
import { PasswordRevalidateGuard } from './guards/password-revalidate.guard';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { FeatureAbilityGuard } from './ability/guard';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';

@Controller('profile')
@InitModule(MODULES.PROFILE)
@UseGuards(JwtAuthGuard, FeatureAbilityGuard)
export class ProfileController implements IProfileController {
  constructor(protected profileService: ProfileService) {}

  @InitFeature(FEATURE_KEY.GET)
  @Get()
  async getUserDetails(@User() user: UserEntity) {
    return this.profileService.getSessionUserDetails(user);
  }

  @InitFeature(FEATURE_KEY.UPDATE)
  @Patch()
  async update(@User() user: UserEntity, @Body() updateUserDto: ProfileUpdateDto) {
    await this.profileService.updateUserName(user.id, updateUserDto);
    await user.reload();
    return {
      first_name: user.firstName,
      last_name: user.lastName,
    };
  }

  @InitFeature(FEATURE_KEY.UPDATE_AVATAR)
  @Patch('avatar')
  @UseInterceptors(FileInterceptor('file'))
  async addAvatar(
    @User() user: UserEntity,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: MAX_AVATAR_FILE_SIZE })],
      })
    )
    file: any
  ) {
    return this.profileService.addAvatar(user.id, file?.buffer, file?.originalname);
  }

  @InitFeature(FEATURE_KEY.UPDATE_PASSWORD)
  @UseGuards(PasswordRevalidateGuard)
  @Patch('password')
  async changePassword(@User() user: UserEntity, @Body() changePasswordDto: ChangePasswordDto) {
    await this.profileService.updateUserPassword(user.id, changePasswordDto.newPassword);
    return;
  }
}
