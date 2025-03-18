import { Controller, Get, UseGuards, Body, Patch, Param } from '@nestjs/common';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { decamelizeKeys } from 'humps';
import { OrganizationConfigsUpdateDto } from './dto';
import { User } from '@modules/app/decorators/user.decorator';
import { ILoginConfigsController } from './interfaces/IController';
import { LoginConfigsService } from './service';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from './constants';
import { FeatureAbilityGuard } from './ability/guard';
import { SSOGuard } from '@modules/licensing/guards/sso.guard';
import { InstanceConfigsUpdateDto } from './dto';
import { NotFoundException } from '@nestjs/common';

@InitModule(MODULES.LOGIN_CONFIGS)
@Controller('login-configs')
export class LoginConfigsController implements ILoginConfigsController {
  constructor(protected loginConfigsService: LoginConfigsService) {}

  @InitFeature(FEATURE_KEY.GET_PUBLIC_CONFIGS)
  @UseGuards(FeatureAbilityGuard)
  @Get(['/:organizationId/public', '/public'])
  async getOrganizationDetails(@Param('organizationId') organizationId: string) {
    const result = await this.loginConfigsService.getProcessedOrganizationDetails(organizationId);
    return decamelizeKeys({ ssoConfigs: result });
  }

  //get all login-configs for organization
  @InitFeature(FEATURE_KEY.GET_ORGANIZATION_CONFIGS)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Get('/organization')
  async getConfigs(@User() user) {
    return await this.loginConfigsService.getProcessedOrganizationConfigs(user.organizationId);
  }

  //update organization-sso configs
  @InitFeature(FEATURE_KEY.UPDATE_ORGANIZATION_SSO)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Patch('/organization-sso')
  async updateOrganizationSSOConfigs(@Body() body, @User() user) {
    const result: any = await this.loginConfigsService.updateOrganizationSSOConfigs(user.organizationId, body);
    return decamelizeKeys({ id: result.id });
  }

  //get instance-sso configs
  @InitFeature(FEATURE_KEY.GET_INSTANCE_SSO)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Get('/instance-sso')
  async getSSOConfigs() {
    const result = await this.loginConfigsService.getInstanceSSOConfigs();
    return decamelizeKeys(result);
  }

  //update instance-sso configs
  @InitFeature(FEATURE_KEY.UPDATE_INSTANCE_SSO)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard, SSOGuard)
  @Patch('/instance-sso')
  async updateSSOConfigs(@Body() body) {
    throw new NotFoundException();
  }

  //update instance-general configs
  @InitFeature(FEATURE_KEY.UPDATE_INSTANCE_GENERAL_CONFIGS)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Patch('/instance-general')
  async updateGeneralConfigs(@Body() instanceConfigsUpdateDto: InstanceConfigsUpdateDto) {
    throw new NotFoundException();
  }

  //update organization-general configs
  @InitFeature(FEATURE_KEY.UPDATE_ORGANIZATION_GENERAL_CONFIGS)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Patch('/organization-general')
  async updateOrganizationGeneralConfigs(
    @Body() organizationConfigsUpdateDto: OrganizationConfigsUpdateDto,
    @User() user
  ) {
    await this.loginConfigsService.updateGeneralOrganizationConfigs(user.organizationId, organizationConfigsUpdateDto);
    return;
  }
}
