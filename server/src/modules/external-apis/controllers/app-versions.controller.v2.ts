import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { Controller, UseGuards, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { FeatureAbilityGuard } from '../ability/guard';
import { IExternalApisAppVersionsControllerV2 } from '../Interfaces/IController';
import {
  CreateAppVersionV2Dto,
  UpdateAppVersionV2Dto,
  PromoteAppVersionV2Dto,
  ListAppVersionsV2QueryDto,
  AppVersionV2ResponseDto,
  ListAppVersionsV2ResponseDto,
} from '../dto';

@Controller({ path: 'ext', version: '2' })
@InitModule(MODULES.EXTERNAL_APIS)
@UseGuards(FeatureAbilityGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class ExternalApisAppVersionsControllerV2 implements IExternalApisAppVersionsControllerV2 {
  createVersion(
    workspaceIdentifier: string,
    appIdentifier: string,
    dto: CreateAppVersionV2Dto
  ): Promise<AppVersionV2ResponseDto> {
    throw new Error('Method not implemented.');
  }
  saveVersion(workspaceIdentifier: string, appIdentifier: string, versionId: string): Promise<AppVersionV2ResponseDto> {
    throw new Error('Method not implemented.');
  }
  promoteVersion(
    workspaceIdentifier: string,
    appIdentifier: string,
    versionId: string,
    dto: PromoteAppVersionV2Dto
  ): Promise<AppVersionV2ResponseDto> {
    throw new Error('Method not implemented.');
  }
  releaseVersion(
    workspaceIdentifier: string,
    appIdentifier: string,
    versionId: string
  ): Promise<AppVersionV2ResponseDto> {
    throw new Error('Method not implemented.');
  }
  listVersions(
    workspaceIdentifier: string,
    appIdentifier: string,
    query: ListAppVersionsV2QueryDto
  ): Promise<ListAppVersionsV2ResponseDto> {
    throw new Error('Method not implemented.');
  }
  getVersion(workspaceIdentifier: string, appIdentifier: string, versionId: string): Promise<AppVersionV2ResponseDto> {
    throw new Error('Method not implemented.');
  }
  updateVersion(
    workspaceIdentifier: string,
    appIdentifier: string,
    versionId: string,
    dto: UpdateAppVersionV2Dto
  ): Promise<AppVersionV2ResponseDto> {
    throw new Error('Method not implemented.');
  }
  deleteVersion(workspaceIdentifier: string, appIdentifier: string, versionId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
