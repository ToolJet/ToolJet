import { InitModule } from '@modules/app/decorators/init-module';
import { VersionService } from './service';
import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { MODULES } from '@modules/app/constants/modules';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { ValidAppGuard } from '@modules/apps/guards/valid-app.guard';
import { FeatureAbilityGuard } from './ability/guard';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from './constants';
import { User } from '@modules/app/decorators/user.decorator';
import { User as UserEntity } from '@entities/user.entity';
import { App as AppEntity } from '@entities/app.entity';
import { AppDecorator as App } from '@modules/app/decorators/app.decorator';
import { VersionCreateDto } from './dto';
import { IVersionController } from './interfaces/IController';
@InitModule(MODULES.VERSION)
@Controller('apps')
export class VersionController implements IVersionController {
  constructor(protected readonly versionService: VersionService) {}

  @InitFeature(FEATURE_KEY.GET)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Get(':id/versions')
  fetchVersions(@App() app: AppEntity) {
    return this.versionService.getAllVersions(app);
  }

  @InitFeature(FEATURE_KEY.CREATE)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Post(':id/versions')
  createVersion(@User() user, @App() app: AppEntity, @Body() versionCreateDto: VersionCreateDto) {
    return this.versionService.createVersion(app, user, versionCreateDto);
  }

  @InitFeature(FEATURE_KEY.DELETE)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Delete(':id/versions/:versionId')
  deleteVersion(@User() user: UserEntity, @App() app: AppEntity) {
    return this.versionService.deleteVersion(app, user);
  }
}
