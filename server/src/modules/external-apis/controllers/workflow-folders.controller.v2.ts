import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { Controller, UseGuards, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { FeatureAbilityGuard } from '../ability/guard';
import { IExternalApisFoldersControllerV2 } from '../Interfaces/IController';
import {
  CreateFolderV2Dto,
  UpdateFolderV2Dto,
  ListFoldersV2QueryDto,
  FolderV2ResponseDto,
  ListFoldersV2ResponseDto,
} from '../dto';

@Controller({ path: 'ext', version: '2' })
@InitModule(MODULES.EXTERNAL_APIS)
@UseGuards(FeatureAbilityGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class ExternalApisWorkflowFoldersControllerV2 implements IExternalApisFoldersControllerV2 {
  createFolder(workspaceIdentifier: string, dto: CreateFolderV2Dto): Promise<FolderV2ResponseDto> {
    throw new Error('Method not implemented.');
  }
  listFolders(workspaceIdentifier: string, query: ListFoldersV2QueryDto): Promise<ListFoldersV2ResponseDto> {
    throw new Error('Method not implemented.');
  }
  getFolder(workspaceIdentifier: string, folderIdentifier: string): Promise<FolderV2ResponseDto> {
    throw new Error('Method not implemented.');
  }
  updateFolder(
    workspaceIdentifier: string,
    folderIdentifier: string,
    dto: UpdateFolderV2Dto
  ): Promise<FolderV2ResponseDto> {
    throw new Error('Method not implemented.');
  }
  deleteFolder(workspaceIdentifier: string, folderIdentifier: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
