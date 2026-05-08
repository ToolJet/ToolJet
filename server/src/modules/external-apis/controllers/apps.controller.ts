import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { Controller, UseGuards } from '@nestjs/common';
import { FeatureAbilityGuard } from '../ability/guard';
import { IExternalApisAppsController } from '../Interfaces/IController';
import { AppGitPullDto, AppGitPushDto, AppImportRequestDto, AutoDeployBodyDto, SaveVersionBodyDto } from '../dto';

@Controller('ext')
@InitModule(MODULES.EXTERNAL_APIS)
@UseGuards(FeatureAbilityGuard)
export class ExternalApisAppsController implements IExternalApisAppsController {
  pullNewAppFromGit(createMode: string, payload: AppGitPullDto): Promise<any> {
    throw new Error('Method not implemented.');
  }
  pullChangesIntoExistingApp(appId: string, createMode: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  pushVersionToGit(appId: string, versionId: string, payload: AppGitPushDto): Promise<any> {
    throw new Error('Method not implemented.');
  }
  autoDeployApp(appIdOrSlug: string, body: AutoDeployBodyDto): Promise<any> {
    throw new Error('Method not implemented.');
  }
  saveAppVersion(appIdOrSlug: string, body: SaveVersionBodyDto): Promise<any> {
    throw new Error('Method not implemented.');
  }
  getAllWorkspaceApps(workspaceId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  importApp(workspaceId: string, importresources: AppImportRequestDto): Promise<{ message: string }> {
    throw new Error('Method not implemented.');
  }
  exportApp(
    appId: string,
    workspaceId: string,
    exportTjdb: boolean,
    appVersion: string,
    exportAllVersions: boolean
  ): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
