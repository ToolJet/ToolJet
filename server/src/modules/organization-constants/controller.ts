import { Controller, Post, UseGuards, Body, Get, Param, Patch, Delete, Query } from '@nestjs/common';
import { decamelizeKeys } from 'humps';
import { User } from '@modules/app/decorators/user.decorator';
import { CreateOrganizationConstantDto, UpdateOrganizationConstantDto } from '@modules/organization-constants/dto';
import { AppDecorator as App } from '@modules/app/decorators/app.decorator';
import { IOrganizationConstantController } from './interfaces/IController';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { OrganizationConstantsService } from './service';
import { FEATURE_KEY, OrganizationConstantType } from './constants';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { FeatureAbilityGuard } from './ability/guard';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { AppAuthGuard } from '@modules/apps/guards/app-auth.guard';

@Controller('organization-constants')
@InitModule(MODULES.ORGANIZATION_CONSTANT)
export class OrganizationConstantController implements IOrganizationConstantController {
  constructor(protected readonly organizationConstantsService: OrganizationConstantsService) {}

  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @InitFeature(FEATURE_KEY.GET)
  @Get()
  async get(@User() user, @Query('type') type: OrganizationConstantType) {
    const result = await this.organizationConstantsService.allEnvironmentConstants(user.organizationId, false, type);
    return { constants: result };
  }

  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @InitFeature(FEATURE_KEY.GET_DECRYPTED_CONSTANTS)
  @Get('decrypted')
  async getDecryptedConstants(@User() user, @Query('type') type: OrganizationConstantType) {
    const result = await this.organizationConstantsService.allEnvironmentConstants(user.organizationId, true, type);
    return { constants: result };
  }

  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @InitFeature(FEATURE_KEY.GET_SECRETS)
  @Get('secrets')
  async getAllSecrets(@User() user) {
    const result = await this.organizationConstantsService.allEnvironmentConstants(
      user.organizationId,
      false,
      OrganizationConstantType.SECRET
    );
    return { constants: result };
  }

  //by default, this api fetches only global constants (for public apps, need to fetch app to get orgId in the public guard)
  @UseGuards(AppAuthGuard)
  @InitFeature(FEATURE_KEY.GET_PUBLIC)
  @Get('public/:slug')
  async getConstantsFromPublicApp(@App() app) {
    const result = await this.organizationConstantsService.allEnvironmentConstants(
      app.organizationId,
      false,
      OrganizationConstantType.GLOBAL
    );
    return { constants: result };
  }

  //by default, this api fetches only global constants
  @UseGuards(JwtAuthGuard)
  @InitFeature(FEATURE_KEY.GET_FROM_APP)
  @Get(':app_slug')
  async getConstantsFromApp(@User() user) {
    const result = await this.organizationConstantsService.allEnvironmentConstants(
      user.organizationId,
      false,
      OrganizationConstantType.GLOBAL
    );
    return { constants: result };
  }

  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Get('/environment/:environmentId')
  @InitFeature(FEATURE_KEY.GET_FROM_ENVIRONMENT)
  async getConstantsFromEnvironment(
    @User() user,
    @Param('environmentId') environmentId,
    @Query('type') type: OrganizationConstantType
  ) {
    const result = await this.organizationConstantsService.getConstantsForEnvironment(
      user.organizationId,
      environmentId
    );
    return { constants: result };
  }

  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Post()
  @InitFeature(FEATURE_KEY.CREATE)
  async create(@User() user, @Body() createOrganizationConstantDto: CreateOrganizationConstantDto) {
    const { organizationId } = user;
    const result = await this.organizationConstantsService.create(createOrganizationConstantDto, organizationId);

    return decamelizeKeys({ constant: result });
  }

  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Patch(':id')
  @InitFeature(FEATURE_KEY.UPDATE)
  async update(@Body() body: UpdateOrganizationConstantDto, @User() user, @Param('id') constantId) {
    const { organizationId } = user;
    const result = await this.organizationConstantsService.update(constantId, organizationId, body);

    return decamelizeKeys({ constant: result });
  }

  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Delete(':id')
  @InitFeature(FEATURE_KEY.DELETE)
  async delete(@User() user, @Param('id') constantId, @Query('environmentId') environmentId) {
    const { organizationId } = user;

    await this.organizationConstantsService.delete(constantId, organizationId);

    return { statusCode: 204 };
  }
}
