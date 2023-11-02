import { Controller, Post, UseGuards, Body, Get, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';
import { User } from 'src/decorators/user.decorator';
import { CustomStylesService } from '@services/custom_styles.service';
import { CustomStylesCreateDto } from '@dto/custom_styles.dto';
import { IsPublicGuard } from 'src/modules/org_environment_variables/is-public.guard';
import { AppDecorator as App } from 'src/decorators/app.decorator';
import { CustomStylesAbilityFactory } from 'src/modules/casl/abilities/custom-styles-ability.factory';
import { CustomStyles } from 'src/entities/custom_styles.entity';
import { CustomStylesGuard } from '@ee/licensing/guards/customStyles.guard';

@Controller('custom-styles')
export class CustomStylesController {
  constructor(
    private customStylesService: CustomStylesService,
    private customStylesAbilityFactory: CustomStylesAbilityFactory
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async get(@User() user) {
    return await this.customStylesService.fetch(user.organizationId);
  }

  @UseGuards(JwtAuthGuard, CustomStylesGuard)
  @Get('/app')
  async getCustomStylesforApp(@User() user) {
    return await this.customStylesService.fetch(user.organizationId);
  }

  @UseGuards(IsPublicGuard, CustomStylesGuard)
  @Get(':app_slug')
  async getStylesFromApp(@App() app) {
    return await this.customStylesService.fetch(app.organizationId);
  }

  @UseGuards(JwtAuthGuard, CustomStylesGuard)
  @Post()
  async create(@User() user, @Body() orgStylesDto: CustomStylesCreateDto) {
    const ability = await this.customStylesAbilityFactory.customStylesActions(user, {});
    if (!ability.can('saveCustomStyles', CustomStyles)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    await this.customStylesService.save(user.organizationId, orgStylesDto.styles);
    return;
  }
}
