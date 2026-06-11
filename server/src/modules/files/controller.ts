import { Controller, Get, Param, UseInterceptors, ClassSerializerInterceptor, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { FilesService } from '@modules/files/service';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { IFilesController } from '@modules/files/interfaces/IController';
import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from './constants';
import { FeatureAbilityGuard } from './ability/guard';
@InitModule(MODULES.FILE)
@UseGuards(JwtAuthGuard, FeatureAbilityGuard)
@Controller('files')
@UseInterceptors(ClassSerializerInterceptor)
export class FilesController implements IFilesController {
  constructor(protected readonly filesService: FilesService) {}

  @InitFeature(FEATURE_KEY.GET)
  @Get(':id')
  async show(@Param('id') id: string, @Res({ passthrough: true }) response: Response) {
    return await this.filesService.getOne(id, response);
  }
}
