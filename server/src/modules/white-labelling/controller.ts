import { Controller, Body, Put, Get, Param } from '@nestjs/common';
import { UpdateWhiteLabellingDto } from './dto';
import { IWhiteLabellingController } from './Interfaces/IController';
import { NotFoundException } from '@nestjs/common';
import { InitModule } from '@modules/app/decorators/init-module';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY } from './constants';

@Controller('white-labelling')
@InitModule(MODULES.WHITE_LABELLING)
export class WhiteLabellingController implements IWhiteLabellingController {
  constructor() {}

  @Get()
  @InitFeature(FEATURE_KEY.GET)
  async get() {
    throw new NotFoundException();
  }

  @Put()
  @InitFeature(FEATURE_KEY.UPDATE)
  async update(@Body() updateWhiteLabellingDto: UpdateWhiteLabellingDto) {
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
    @Body() updateWhiteLabellingDto: UpdateWhiteLabellingDto
  ) {
    throw new NotFoundException();
  }
}
