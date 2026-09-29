import { InitModule } from '@modules/app/decorators/init-module';
import { VersionService } from './service';
import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
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
import { CreateVersionResponseDto, DraftVersionDto, VersionCreateDto } from './dto';
import { IVersionController } from './interfaces/IController';
import { IdempotencyInterceptor } from '@modules/idempotency/interceptor';
@InitModule(MODULES.VERSION)
@Controller('apps')
export class VersionController implements IVersionController {
  constructor(protected readonly versionService: VersionService) {}

  @InitFeature(FEATURE_KEY.GET)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Get(':id/versions')
  fetchVersions(@User() user: UserEntity, @App() app: AppEntity) {
    return this.versionService.getAllVersions(app, user.branchId);
  }

  @InitFeature(FEATURE_KEY.APP_VERSION_CREATE)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @UseInterceptors(IdempotencyInterceptor, ClassSerializerInterceptor)
  @Post(':id/versions')
  async createVersion(
    @User() user: UserEntity,
    @App() app: AppEntity,
    @Body() versionCreateDto: VersionCreateDto
  ): Promise<CreateVersionResponseDto> {
    versionCreateDto.branchId = user.branchId;
    const result = await this.versionService.createOrEnqueueVersion(app, user, versionCreateDto);
    return plainToInstance(CreateVersionResponseDto, result);
  }

  @InitFeature(FEATURE_KEY.APP_VERSION_DELETE)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Delete(':id/versions/:versionId')
  deleteVersion(@User() user: UserEntity, @App() app: AppEntity) {
    return this.versionService.deleteVersion(app, user);
  }
  @InitFeature(FEATURE_KEY.APP_DRAFT_VERSION_CREATE)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Post(':id/draft-versions')
  createDraftVersion(@User() user: UserEntity, @App() app: AppEntity, @Body() draftVersionDto: DraftVersionDto) {
    draftVersionDto.branchId = user.branchId;
    return this.versionService.createDraftVersion(app, user, draftVersionDto);
  }
}
