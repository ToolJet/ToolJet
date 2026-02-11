import { Controller, Get, Post, Delete, Body, Query } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { InitModule } from '@modules/app/decorators/init-module';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY } from './constant';
import { CustomDomainsService } from './service';
import { CreateCustomDomainDto } from './dto';
import { User as UserEntity } from '@entities/user.entity';
import { User } from '@modules/app/decorators/user.decorator';

@Controller('custom-domains')
@InitModule(MODULES.CUSTOM_DOMAINS)
export class CustomDomainsController {
  constructor(protected readonly customDomainsService: CustomDomainsService) {}

  @Get()
  @InitFeature(FEATURE_KEY.GET)
  async getCustomDomain(@User() user: UserEntity): Promise<any> {
    throw new NotFoundException();
  }

  @Post()
  @InitFeature(FEATURE_KEY.CREATE)
  async createCustomDomain(@Body() dto: CreateCustomDomainDto, @User() user: UserEntity): Promise<any> {
    throw new NotFoundException();
  }

  @Post('verify')
  @InitFeature(FEATURE_KEY.VERIFY)
  async verifyCustomDomain(@User() user: UserEntity): Promise<any> {
    throw new NotFoundException();
  }

  @Get('status')
  @InitFeature(FEATURE_KEY.STATUS)
  async getCustomDomainStatus(@User() user: UserEntity): Promise<any> {
    throw new NotFoundException();
  }

  @Delete()
  @InitFeature(FEATURE_KEY.DELETE)
  async deleteCustomDomain(@User() user: UserEntity): Promise<any> {
    throw new NotFoundException();
  }

  @Get('resolve')
  @InitFeature(FEATURE_KEY.RESOLVE)
  async resolveCustomDomain(@Query('domain') domain: string): Promise<any> {
    throw new NotFoundException();
  }
}
