import {
  Controller,
  Post,
  UseGuards,
  Body,
  Get,
  // Patch,
  // Delete,
  // Param,
  // BadRequestException,
  // ForbiddenException,
  // Query,
} from '@nestjs/common';
import { decamelizeKeys } from 'humps';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';

import { User } from 'src/decorators/user.decorator';
import { OrganizationConstantsService } from '@services/organization_constants.service';
import { CreateOrganizationConstantDto } from '@dto/organization-constant.dto';
// import { OrganizationConstants } from '../entities/organization_constants.entity';
import { IsPublicGuard } from 'src/modules/org_environment_variables/is-public.guard';
import { AppDecorator as App } from 'src/decorators/app.decorator';

@Controller('organization-constants')
export class OrganizationConstantController {
  constructor(private organizationConstantsService: OrganizationConstantsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async get(@User() user) {
    const result = await this.organizationConstantsService.fetchVariables(user.organizationId);
    return { constants: result };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@User() user, @Body() createOrganizationConstantDto: CreateOrganizationConstantDto) {
    const { organizationId } = user;
    const result = await this.organizationConstantsService.create(createOrganizationConstantDto, organizationId);

    return decamelizeKeys({ constant: result });
  }

  @UseGuards(IsPublicGuard)
  @Get(':app_slug')
  async getVariablesFromApp(@App() app) {
    // const result = await this.organizationConstantsService.fetchVariables(app.organizationId);
    return decamelizeKeys({ result: 'from slug' });
  }
}
