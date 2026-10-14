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
import { BulkFolderDeleteService } from './bulk-folder-delete.service';
import { BulkDeleteFoldersDto, BulkDeleteFoldersResponseDto } from './dto/bulk.dto';

// Coarse gate = app listing (everyone); per-folder and per-app checks run in BulkFolderDeleteService.
@InitModule(MODULES.APP)
@Controller({ path: 'folders', version: '2' })
@UseInterceptors(ClassSerializerInterceptor)
export class DashboardBulkFolderDeleteController {
  constructor(private readonly bulkFolderDeleteService: BulkFolderDeleteService) {}

  @InitFeature(FEATURE_KEY.GET)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Post('bulk-delete')
  @HttpCode(200)
  delete(@User() user: UserEntity, @Body() body: BulkDeleteFoldersDto): Promise<BulkDeleteFoldersResponseDto> {
    return this.bulkFolderDeleteService.delete(user, body);
  }
}
