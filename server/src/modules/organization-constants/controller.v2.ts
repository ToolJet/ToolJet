import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { User } from '@modules/app/decorators/user.decorator';
import { User as UserEntity } from '@entities/user.entity';
import { InitModule } from '@modules/app/decorators/init-module';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { MODULES } from '@modules/app/constants/modules';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { FeatureAbilityGuard } from './ability/guard';
import { FEATURE_KEY } from './constants';
import { OrganizationConstantsService } from './service';
import { ListConstantsQueryDto } from './dto/v2/list-constants.query.dto';
import { ConstantDetailResponseDto, ConstantListResponseDto } from './dto/v2/constant.response.dto';

@InitModule(MODULES.ORGANIZATION_CONSTANT)
@Controller({ path: 'organization-constants', version: '2' })
@UseInterceptors(ClassSerializerInterceptor)
export class OrganizationConstantControllerV2 {
  constructor(protected readonly organizationConstantsService: OrganizationConstantsService) {}

  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @InitFeature(FEATURE_KEY.LIST)
  @Get()
  async list(@User() user: UserEntity, @Query() query: ListConstantsQueryDto): Promise<ConstantListResponseDto> {
    const result = await this.organizationConstantsService.listConstants(user.organizationId, query);
    return plainToInstance(ConstantListResponseDto, result);
  }

  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @InitFeature(FEATURE_KEY.GET)
  @Get(':id')
  async get(@User() user: UserEntity, @Param('id', ParseUUIDPipe) id: string): Promise<ConstantDetailResponseDto> {
    const result = await this.organizationConstantsService.getConstant(user.organizationId, id);
    return plainToInstance(ConstantDetailResponseDto, result);
  }
}
