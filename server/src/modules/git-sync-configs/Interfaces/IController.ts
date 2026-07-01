import {
  OrganizationGitCreateDto,
  OrganizationGitStatusUpdateDto,
  OrganizationGitUpdateDto,
} from '@dto/organization_git.dto';
import { User as UserEntity } from 'src/entities/user.entity';

export interface IGitSyncConfigsController {
  getOrgGitByOrgId(user: UserEntity, organizationId: string, gitType: string): Promise<any>;
  getOrgGitStatusByOrgId(user: UserEntity, organizationId: string): Promise<any>;
  create(user: UserEntity, orgGitCreateDto: OrganizationGitCreateDto, gitType: string): Promise<any>;
  update(
    user: UserEntity,
    organizationGitId: string,
    orgGitUpdateDto: OrganizationGitUpdateDto,
    gitType: string
  ): Promise<any>;
  changeStatus(
    user: UserEntity,
    organizationGitId: string,
    organizationGitStatusUpdateDto: OrganizationGitStatusUpdateDto
  ): Promise<any>;
  deleteConfig(user: UserEntity, organizationGitId: string, gitType: string): Promise<any>;
}
