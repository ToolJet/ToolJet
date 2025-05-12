import { User as UserEntity } from '../../../entities/user.entity';
import { OrganizationGitCreateDto, OrganizationGitStatusUpdateDto, OrganizationGitUpdateDto } from '../dto';

export interface IGitSyncController {
  getOrgGitByOrgId(user: UserEntity, organizationId: string, gitType: string): any;

  getOrgGitStatusByOrgId(user: UserEntity, organizationId: string): Promise<any>;

  create(user: UserEntity, orgGitCreateDto: OrganizationGitCreateDto, gitType: string): Promise<any>;

  update(
    user: UserEntity,
    organizationGitId: string,
    orgGitUpdateDto: OrganizationGitUpdateDto,
    gitType: string
  ): Promise<void>;

  setFinalizeConfig(user: UserEntity, organizationGitId: string, gitType: string): Promise<void>;

  changeStatus(
    user: UserEntity,
    organizationGitId: string,
    organizationGitStatusUpdateDto: OrganizationGitStatusUpdateDto
  ): Promise<void>;

  deleteConfig(user: UserEntity, organizationGitId: string, gitType: string): Promise<void>;
}
