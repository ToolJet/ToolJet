import { Controller, Get, Request } from '@nestjs/common';
import { AppConfigService } from '@services/app_config.service';

@Controller('config')
export class AppConfigController {
  constructor(private AppConfigService: AppConfigService) {}

  @Get()
  async index() {
    const config = await this.AppConfigService.public_config();

    return config;
  }
}
