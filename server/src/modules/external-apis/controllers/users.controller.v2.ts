import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { Controller, UseGuards } from '@nestjs/common';
import { FeatureAbilityGuard } from '../ability/guard';
import { ListWorkspaceAppUsersV2QueryDto, ListWorkspaceUserAppsV2QueryDto } from '../dto';

@Controller({ path: 'ext', version: '2' })
@InitModule(MODULES.EXTERNAL_APIS)
@UseGuards(FeatureAbilityGuard)
export class ExternalApisUsersControllerV2 {
  listWorkspaceUserApps(
    workspaceIdentifier: string,
    userIdentifier: string,
    query: ListWorkspaceUserAppsV2QueryDto
  ): Promise<any> {
    throw new Error('Method not implemented.');
  }
  listWorkspaceAppUsers(
    workspaceIdentifier: string,
    appIdentifier: string,
    query: ListWorkspaceAppUsersV2QueryDto
  ): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
