import { Body, Controller, Delete, NotFoundException, Put, UseGuards } from '@nestjs/common';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from '@modules/versions/constants';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { User } from '@modules/app/decorators/user.decorator';
import { UserEntity } from '@modules/app/decorators/user.decorator';
import { AppVersionUpdateDto } from '@dto/app-version-update.dto';

// CE stub controller. Git-aware version save/delete is EE-only; the real routes live in
// ee/app-git/versions.controller.ts (which extends this). On CE these throw (git sync is EE-only) —
// non-git version save/delete continues through the versions module (/api/v2/apps/...).
@InitModule(MODULES.VERSION)
@Controller('app-git')
export class AppGitVersionsController {
  constructor() {}

  @InitFeature(FEATURE_KEY.APP_VERSION_UPDATE)
  @UseGuards(JwtAuthGuard)
  @Put(':id/versions/:versionId')
  async saveVersion(@User() _user: UserEntity, @Body() _dto: AppVersionUpdateDto): Promise<any> {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.APP_VERSION_DELETE)
  @UseGuards(JwtAuthGuard)
  @Delete(':id/versions/:versionId')
  async deleteVersion(@User() _user: UserEntity): Promise<any> {
    throw new NotFoundException();
  }
}
