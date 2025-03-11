import { Body, Controller, Post, UseGuards, Res } from '@nestjs/common';
import { User, UserEntity } from '@modules/app/decorators/user.decorator';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { OrganizationCreateDto } from '@modules/organizations/dto';
import { Response } from 'express';
import { SetupOrganizationsService } from './service';
import { ISetupOrganizationsController } from './interfaces/IController';
import { SessionUtilService } from '@modules/session/util.service';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from '@modules/organizations/constants';
import { FeatureAbilityGuard } from '@modules/organizations/ability/guard';

@InitModule(MODULES.ORGANIZATIONS)
@Controller('organizations')
@UseGuards(JwtAuthGuard, FeatureAbilityGuard)
export class SetupOrganizationsController implements ISetupOrganizationsController {
  constructor(
    protected setupOrganizationsService: SetupOrganizationsService,
    protected sessionUtilService: SessionUtilService
  ) {}

  @InitFeature(FEATURE_KEY.CREATE)
  @Post()
  async create(
    @User() user: UserEntity,
    @Body() organizationCreateDto: OrganizationCreateDto,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await this.setupOrganizationsService.create(
      organizationCreateDto.name,
      organizationCreateDto.slug,
      user
    );

    if (!result) {
      throw new Error();
    }
    return await this.sessionUtilService.switchOrganization(response, result.id, user, true);
  }
}
