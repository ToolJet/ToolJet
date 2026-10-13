import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  HttpCode,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { User as UserEntity } from '@entities/user.entity';
import { InitModule } from '@modules/app/decorators/init-module';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { User } from '@modules/app/decorators/user.decorator';
import { MODULES } from '@modules/app/constants/modules';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { FeatureAbilityGuard } from '../ability/guard';
import { FEATURE_KEY } from '../constants';
import { BulkMoveService } from './bulk-move.service';
import { BulkMoveAppsDto, BulkResultResponseDto } from './dto/bulk.dto';

// Coarse gate = app listing (everyone); per-app check runs in BulkMoveService.
@InitModule(MODULES.APP)
@Controller({ path: 'folder-apps', version: '2' })
@UseInterceptors(ClassSerializerInterceptor)
export class DashboardBulkMoveController {
  constructor(private readonly bulkMoveService: BulkMoveService) {}

  @InitFeature(FEATURE_KEY.GET)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Post('bulk-move')
  @HttpCode(200)
  move(@User() user: UserEntity, @Body() body: BulkMoveAppsDto): Promise<BulkResultResponseDto> {
    return this.bulkMoveService.move(user, body);
  }
}
