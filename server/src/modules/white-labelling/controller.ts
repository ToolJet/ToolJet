import { Controller, Body, Put, Get, Param } from '@nestjs/common';
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
  async getInstanceWhiteLabelling() {
    const formattedSettings = await this.whiteLabellingService.getProcessedSettings(null);
    return formattedSettings;
  }

  @Put()
  @InitFeature(FEATURE_KEY.UPDATE)
  async updateInstanceWhiteLabelling(
    @Body() updateWhiteLabellingDto: UpdateWhiteLabellingDto,
    @User() user: UserEntity
  ) {
    throw new NotFoundException();
  }

  @Get('/:organizationId')
  @InitFeature(FEATURE_KEY.GET_ORGANIZATION_WHITE_LABELS)
  async getWorkspaceWhiteLabelling(req: any) {
    throw new NotFoundException();
  }

  @Put('/:organizationId')
  @InitFeature(FEATURE_KEY.UPDATE_ORGANIZATION_WHITE_LABELS)
  async updateWorkspaceWhiteLabelling(
    @Param('organizationId') organizationId: string,
    @Body() updateWhiteLabellingDto: UpdateWhiteLabellingDto,
    user: any
  ) {
    throw new NotFoundException();
  }
}
