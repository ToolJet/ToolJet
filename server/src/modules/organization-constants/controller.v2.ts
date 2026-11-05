import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
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
import { CreateConstantDto } from './dto/v2/create-constant.dto';
import { UpdateConstantValuesDto } from './dto/v2/update-constant.dto';
import { BulkDeleteConstantsDto } from './dto/v2/bulk-delete-constants.dto';
import {
  BulkDeleteConstantsResponseDto,
  ConstantDetailResponseDto,
  ConstantListResponseDto,
} from './dto/v2/constant.response.dto';

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

  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @InitFeature(FEATURE_KEY.CREATE)
  @Post()
  async create(@User() user: UserEntity, @Body() dto: CreateConstantDto): Promise<ConstantDetailResponseDto> {
    const result = await this.organizationConstantsService.createConstant(user.organizationId, user.id, dto);
    return plainToInstance(ConstantDetailResponseDto, result);
  }

  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @InitFeature(FEATURE_KEY.BULK_DELETE)
  @HttpCode(200)
  @Post('bulk-delete')
  async bulkDelete(
    @User() user: UserEntity,
    @Body() dto: BulkDeleteConstantsDto
  ): Promise<BulkDeleteConstantsResponseDto> {
    const result = await this.organizationConstantsService.bulkDeleteConstants(user.organizationId, dto.ids);
    return plainToInstance(BulkDeleteConstantsResponseDto, result);
  }

  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @InitFeature(FEATURE_KEY.UPDATE)
  @Patch(':id')
  async update(
    @User() user: UserEntity,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateConstantValuesDto
  ): Promise<ConstantDetailResponseDto> {
    const result = await this.organizationConstantsService.updateConstantValues(user.organizationId, id, user.id, dto);
    return plainToInstance(ConstantDetailResponseDto, result);
  }
}
