import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { Controller, UseGuards, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { FeatureAbilityGuard } from '../ability/guard';
import { IExternalApisUsersControllerV2 } from '../Interfaces/IController';
import { UpdateUserV2Dto, ListUsersV2QueryDto, ListUserWorkspacesV2QueryDto } from '../dto';

@Controller({ path: 'ext', version: '2' })
@InitModule(MODULES.EXTERNAL_APIS)
@UseGuards(FeatureAbilityGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class ExternalApisUsersControllerV2 implements IExternalApisUsersControllerV2 {
  listUsers(query: ListUsersV2QueryDto): Promise<any> {
    throw new Error('Method not implemented.');
  }
  getUser(userIdentifier: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  updateUser(userIdentifier: string, dto: UpdateUserV2Dto): Promise<any> {
    throw new Error('Method not implemented.');
  }
  archiveUser(userIdentifier: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  unarchiveUser(userIdentifier: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  listUserWorkspaces(userIdentifier: string, query: ListUserWorkspacesV2QueryDto): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
