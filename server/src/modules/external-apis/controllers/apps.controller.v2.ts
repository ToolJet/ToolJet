import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { Controller, UseGuards } from '@nestjs/common';
import { FeatureAbilityGuard } from '../ability/guard';
import { IExternalApisAppsControllerV2 } from '../Interfaces/IController';
import { CreateAppV2Dto, RenameAppV2Dto, ListAppsV2QueryDto, ImportAppV2Dto } from '../dto';

@Controller({ path: 'ext', version: '2' })
@InitModule(MODULES.EXTERNAL_APIS)
@UseGuards(FeatureAbilityGuard)
export class ExternalApisAppsControllerV2 implements IExternalApisAppsControllerV2 {
  createApp(workspaceIdentifier: string, dto: CreateAppV2Dto): Promise<any> {
    throw new Error('Method not implemented.');
  }
  renameApp(workspaceIdentifier: string, appIdentifier: string, dto: RenameAppV2Dto): Promise<any> {
    throw new Error('Method not implemented.');
  }
  listApps(workspaceIdentifier: string, query: ListAppsV2QueryDto): Promise<any> {
    throw new Error('Method not implemented.');
  }
  getApp(workspaceIdentifier: string, appIdentifier: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  deleteApp(workspaceIdentifier: string, appIdentifier: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  importApp(workspaceIdentifier: string, dto: ImportAppV2Dto): Promise<any> {
    throw new Error('Method not implemented.');
  }
  exportApp(
    workspaceIdentifier: string,
    appIdentifier: string,
    exportTjdb?: boolean,
    appVersion?: string,
    exportAllVersions?: boolean
  ): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
