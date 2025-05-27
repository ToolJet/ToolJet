import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { Body, Controller, Delete, Post, Put, UseGuards } from '@nestjs/common';
import { FEATURE_KEY } from '../constants';
import { App as AppEntity } from '@entities/app.entity';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { ValidAppGuard } from '@modules/apps/guards/valid-app.guard';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { FeatureAbilityGuard } from '../ability/guard';
import { AppDecorator as App } from '@modules/app/decorators/app.decorator';
import { ComponentsService } from '@modules/apps/services/component.service';
import {
  BatchComponentsDto,
  CreateComponentDto,
  DeleteComponentDto,
  LayoutUpdateDto,
  UpdateComponentDto,
} from '@modules/apps/dto/component';
import { IComponentsController } from '../interfaces/controllers/IComponentsController';

@InitModule(MODULES.VERSION)
@Controller({
  path: 'apps',
  version: '2',
})
export class ComponentsController implements IComponentsController {
  constructor(protected readonly componentsService: ComponentsService) {}

  @InitFeature(FEATURE_KEY.CREATE_COMPONENTS)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Post(':id/versions/:versionId/components')
  async createComponent(@App() app: AppEntity, @Body() createComponentDto: CreateComponentDto) {
    await this.componentsService.create(createComponentDto.diff, createComponentDto.pageId, app.appVersions[0].id);
    return;
  }

  @InitFeature(FEATURE_KEY.UPDATE_COMPONENTS)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Put(':id/versions/:versionId/components')
  async updateComponent(@App() app: AppEntity, @Body() updateComponentDto: UpdateComponentDto) {
    await this.componentsService.update(updateComponentDto.diff, app.appVersions[0].id);
    return;
  }

  @InitFeature(FEATURE_KEY.DELETE_COMPONENTS)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Delete(':id/versions/:versionId/components')
  async deleteComponents(@App() app: AppEntity, @Body() deleteComponentDto: DeleteComponentDto) {
    await this.componentsService.delete(
      deleteComponentDto.diff,
      app.appVersions[0].id,
      deleteComponentDto.is_component_cut
    );
  }

  @InitFeature(FEATURE_KEY.UPDATE_COMPONENT_LAYOUT)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Put(':id/versions/:versionId/components/layout')
  async updateComponentLayout(@App() app: AppEntity, @Body() updateComponentLayout: LayoutUpdateDto) {
    await this.componentsService.componentLayoutChange(updateComponentLayout.diff, app.appVersions[0].id);
  }

  @InitFeature(FEATURE_KEY.UPDATE_COMPONENTS)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Put(':id/versions/:versionId/components/batch')
  async batchComponentOperations(@App() app: AppEntity, @Body() batchComponentsDto: BatchComponentsDto) {
    return this.componentsService.batchOperations(batchComponentsDto.diff, app.appVersions[0].id);
  }
}
