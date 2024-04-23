import { Controller, Get, UseGuards, Body, Patch } from '@nestjs/common';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';
import { InstanceConfigsUpdateDto } from '@dto/create_instance_settings.dto';
import { SuperAdminGuard } from 'src/modules/auth/super-admin.guard';
import { SSOGuard } from '@ee/licensing/guards/sso.guard';
import { OrganizationsService } from '@services/organizations.service';
import { decamelizeKeys } from 'humps';
import { InstanceLoginConfigsService } from '@services/instance_login_configs.service';

@Controller('instance-login-configs')
@UseGuards(JwtAuthGuard)
export class InstanceLoginConfigsController {
  constructor(
    private organizationsService: OrganizationsService,
    private instanceLoginConfigsService: InstanceLoginConfigsService
  ) {}

  @Get('/sso')
  async getSSOConfigs() {
    const result = await this.organizationsService.getInstanceSSOConfigs();
    return decamelizeKeys(result);
  }

  @UseGuards(SSOGuard, SuperAdminGuard)
  @Patch('/sso')
  async updateSSOConfigs(@Body() body) {
    const result = await this.organizationsService.updateInstanceSSOConfigs(body);
    return result;
  }

  @UseGuards(SuperAdminGuard)
  @Patch('/')
  async updateGeneralConfigs(@Body() instanceConfigsUpdateDto: InstanceConfigsUpdateDto) {
    const configKeyMap = {
      allowedDomains: 'ALLOWED_DOMAINS',
      enableSignUp: 'ENABLE_SIGNUP',
      enableWorkspaceConfiguration: 'ENABLE_WORKSPACE_LOGIN_CONFIGURATION',
    };
    const generalConfigsMap = Object.keys(instanceConfigsUpdateDto).reduce((acc, key) => {
      const configKey = configKeyMap[key];
      if (configKey) {
        acc[configKey] = instanceConfigsUpdateDto[key];
      }
      return acc;
    }, {});
    await this.instanceLoginConfigsService.validateAndUpdateSystemParams(generalConfigsMap);
  }
}
