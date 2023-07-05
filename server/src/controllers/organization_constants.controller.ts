import {
  Controller,
  Post,
  UseGuards,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  BadRequestException,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { decamelizeKeys } from 'humps';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';
import { IsPublicGuard } from 'src/modules/org_environment_variables/is-public.guard';
import { User } from 'src/decorators/user.decorator';
import { OrganizationConstantsService } from '@services/organization_constants.service';
import { CreateOrganizationConstantDto, UpdateOrganizationConstantDto } from '@dto/organization-constant.dto';
import { OrganizationConstant } from '../entities/organization_constants.entity';
import { OrganizationConstantsAbilityFactory } from 'src/modules/casl/abilities/organization-constants-ability.factory';
import { AppDecorator as App } from 'src/decorators/app.decorator';

@Controller('organization-constants')
export class OrganizationConstantController {
  constructor(
    private organizationConstantsService: OrganizationConstantsService,
    private organizationConstantsAbilityFactory: OrganizationConstantsAbilityFactory
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async get(@User() user) {
    const result = await this.organizationConstantsService.allEnvironmentConstants(user.organizationId);
    return { constants: result };
  }

  @UseGuards(IsPublicGuard)
  @Get(':app_slug')
  async getConstantsFromApp(@App() app) {
    const result = await this.organizationConstantsService.allEnvironmentConstants(app.organizationId);
    return { constants: result };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':environmentId')
  async getConstantsFromEnvironment(@User() user, @Param('environmentId') environmentId) {
    const result = await this.organizationConstantsService.getConstantsForEnvironment(
      user.organizationId,
      environmentId
    );
    return { constants: result };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@User() user, @Body() createOrganizationConstantDto: CreateOrganizationConstantDto) {
    const ability = await this.organizationConstantsAbilityFactory.organizationConstantActions(user, {});

    if (!ability.can('createOrganizationConstant', OrganizationConstant)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    const { organizationId } = user;
    const result = await this.organizationConstantsService.create(createOrganizationConstantDto, organizationId);

    return decamelizeKeys({ constant: result });
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Body() body: UpdateOrganizationConstantDto, @User() user, @Param('id') constantId) {
    const ability = await this.organizationConstantsAbilityFactory.organizationConstantActions(user, {});

    if (!ability.can('createOrganizationConstant', OrganizationConstant)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    const { organizationId } = user;
    const result = await this.organizationConstantsService.update(constantId, organizationId, body);

    return decamelizeKeys({ constant: result });
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@User() user, @Param('id') constantId, @Query('environmentId') environmentId) {
    const ability = await this.organizationConstantsAbilityFactory.organizationConstantActions(user, {});

    if (!ability.can('deleteOrganizationConstant', OrganizationConstant)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    const { organizationId } = user;
    const result = await this.organizationConstantsService.delete(constantId, organizationId, environmentId);

    if (result.affected == 1) {
      return;
    } else {
      throw new BadRequestException();
    }
  }
}
