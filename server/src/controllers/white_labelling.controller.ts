import { Controller, UseGuards, Body, Put, Get } from '@nestjs/common';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';
import { InstanceSettingsService } from '@services/instance_settings.service';
import { SuperAdminGuard } from 'src/modules/auth/super-admin.guard';
import { WhiteLabellingGuard } from '@ee/licensing/guards/whiteLabelling.guard';
import { UpdateWhiteLabellingDto } from '@dto/update_white_labelling.dto';
import { INSTANCE_SETTINGS_TYPE } from 'src/helpers/instance_settings.constants';

@Controller('white-labelling')
export class WhiteLabellingController {
  constructor(private instanceSettingsService: InstanceSettingsService) {}

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Get()
  async index() {
    const settings = await this.instanceSettingsService.listSettings(INSTANCE_SETTINGS_TYPE.SYSTEM);

    const whiteLabellingOptions = {
      WHITE_LABEL_LOGO: 'App Logo',
      WHITE_LABEL_TEXT: 'Page Title',
      WHITE_LABEL_FAVICON: 'Favicon',
    };

    const whiteLabelSettings = settings
      .filter((setting) => setting.key in whiteLabellingOptions)
      .reduce((result, setting) => {
        const key = whiteLabellingOptions[setting.key];
        result[key] = setting.value;
        return result;
      }, {});

    return whiteLabelSettings;
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard, WhiteLabellingGuard)
  @Put()
  async update(@Body() updateWhiteLabellingDto: UpdateWhiteLabellingDto) {
    const whiteLabelSettings = {
      WHITE_LABEL_LOGO: updateWhiteLabellingDto['appLogo'],
      WHITE_LABEL_FAVICON: updateWhiteLabellingDto['favicon'],
      WHITE_LABEL_TEXT: updateWhiteLabellingDto['pageTitle'],
    };
    await this.instanceSettingsService.updateSystemParams(whiteLabelSettings);
  }
}
