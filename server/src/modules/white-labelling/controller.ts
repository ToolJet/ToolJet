import { Controller, Body, Put, Get, Param, Query } from '@nestjs/common';
import { UpdateWhiteLabellingDto } from './dto';
import { IWhiteLabellingController } from './Interfaces/IController';
import { NotFoundException } from '@nestjs/common';
import { InitModule } from '@modules/app/decorators/init-module';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY } from './constant';
import { WhiteLabellingService } from './service';
import { User as UserEntity } from '@entities/user.entity';
import { User } from '@modules/app/decorators/user.decorator';

@Controller('white-labelling')
@InitModule(MODULES.WHITE_LABELLING)
export class WhiteLabellingController implements IWhiteLabellingController {
  constructor(protected readonly whiteLabellingService: WhiteLabellingService) {}

  @Get()
  @InitFeature(FEATURE_KEY.GET)
  async get(@Query('organizationId') organizationId: string) {
    return this.whiteLabellingService.getProcessedSettings(null);
  }

  @Put()
  @InitFeature(FEATURE_KEY.UPDATE)
  async update(@Body() updateWhiteLabellingDto: UpdateWhiteLabellingDto, @User() user: UserEntity) {
    throw new NotFoundException();
  }

  @Get('/:workspaceId')
  @InitFeature(FEATURE_KEY.GET_WORKSPACE_SETTINGS)
  async getWorkspaceSettings(@Param('workspaceId') workspaceId: string) {
    throw new NotFoundException();
  }

  @Put('/:organizationId')
  @InitFeature(FEATURE_KEY.UPDATE_WORKSPACE_SETTINGS)
  async updateWorkspaceSettings(
    @Param('organizationId') organizationId: string,
    @Body() updateWhiteLabellingDto: UpdateWhiteLabellingDto,
    @User() user: UserEntity
  ) {
    throw new NotFoundException();
  }
}
