import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { ValidAppGuard } from '@modules/apps/guards/valid-app.guard';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { Body, Controller, Delete, Param, Post, Put, UseGuards } from '@nestjs/common';
import { FeatureAbilityGuard } from '../ability/guard';
import { AppDecorator as App } from '@modules/app/decorators/app.decorator';
import { App as AppEntity } from '@entities/app.entity';
import { CreatePageDto } from '@modules/apps/dto/page';
import { PageService } from '@modules/apps/services/page.service';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from '../constants';
import { IPagesController } from '../interfaces/controllers/IPagesController';

@InitModule(MODULES.VERSION)
@Controller({
  path: 'apps',
  version: '2',
})
export class PagesController implements IPagesController {
  constructor(protected readonly pageService: PageService) {}

  @InitFeature(FEATURE_KEY.UPDATE_PAGES)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Put(':id/versions/:versionId/pages')
  async updatePages(@App() app: AppEntity, @Body() updatePageDto) {
    console.log({ updatePageDto });
    await this.pageService.updatePage(updatePageDto, app.appVersions[0].id);
    return;
  }

  @InitFeature(FEATURE_KEY.CREATE_PAGES)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Post(':id/versions/:versionId/pages')
  async createPages(@App() app: AppEntity, @Body() createPageDto: CreatePageDto) {
    await this.pageService.createPage(createPageDto, app.appVersions[0].id);
    return;
  }

  @InitFeature(FEATURE_KEY.CLONE_PAGES)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Post(':id/versions/:versionId/pages/:pageId/clone')
  clonePage(@App() app: AppEntity, @Param('pageId') pageId) {
    return this.pageService.clonePage(pageId, app.appVersions[0].id);
  }

  @InitFeature(FEATURE_KEY.REORDER_PAGES)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Put(':id/versions/:versionId/pages/reorder')
  async reorderPages(@App() app: AppEntity, @Body() reorderPagesDto) {
    await this.pageService.reorderPages(reorderPagesDto, app.appVersions[0].id);
  }

  @InitFeature(FEATURE_KEY.DELETE_PAGE)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Delete(':id/versions/:versionId/pages')
  async deletePage(@App() app: AppEntity, @Body() deletePageDto) {
    await this.pageService.deletePage(
      deletePageDto.pageId,
      app.appVersions[0].id,
      app.editingVersion,
      deletePageDto.deleteAssociatedPages
    );
    return;
  }
}
