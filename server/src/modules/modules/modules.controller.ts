import { Controller, Post, UseGuards, Body } from '@nestjs/common';
import { User } from '@modules/app/decorators/user.decorator';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { AppCreateDto } from '@modules/apps/dto';
import { IModulesController } from '@modules/modules/IModulesController';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from '@modules/modules/constants';

@InitModule(MODULES.MODULES)
@Controller('modules')
export class ModulesController implements IModulesController {
  @InitFeature(FEATURE_KEY.CREATE_MODULE)
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@User() user, @Body() appCreateDto: AppCreateDto): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
