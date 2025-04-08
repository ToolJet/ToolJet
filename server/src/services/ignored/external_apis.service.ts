import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from 'src/entities/user.entity';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { Organization } from 'src/entities/organization.entity';
import { GroupPermission } from 'src/entities/group_permission.entity';
import { UserGroupPermission } from 'src/entities/user_group_permission.entity';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import { EntityManager } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { CreateUserDto, Status, UpdateGivenWorkspaceDto, UpdateUserDto, WorkspaceDto } from '@dto/external_apis.dto';

@Injectable()
export class ExternalApisService {
  constructor() {}

  private generateRandomPassword(length: number = 8): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    return password;
  }

  async getAllUsers(id?: string, manager?: EntityManager) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const query = manager
        .createQueryBuilder(User, 'user')
        .leftJoinAndSelect('user.organizationUsers', 'organizationUser')
        .leftJoinAndSelect('organizationUser.organization', 'organization', 'organization.status=:activeStatus', {
          activeStatus: 'active',
        })
        .leftJoinAndSelect('user.userGroupPermissions', 'userGroupPermissions')
        .leftJoinAndSelect('userGroupPermissions.groupPermission', 'groupPermissions');

      if (id) {
        query.andWhere('user.id=:id', { id });
      }
      const users: User[] = await query.getMany();

      const userResponses = users?.map((user) => {
        const userResponse = {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          status: user.status,
          workspaces: [],
        };
        const workspaces = user?.organizationUsers?.map((ou) => {
          const workspaceResponse = {
            id: ou.organization?.id,
            name: ou.organization?.name,
            status: ou.organization?.status,
            groups: [],
          };
          const groups = user?.userGroupPermissions
            ?.filter((ugp) => ugp.groupPermission.organizationId === workspaceResponse.id)
            ?.map((ugp) => {
              return {
                id: ugp?.groupPermission?.id,
                name: ugp?.groupPermission.group,
              };
            });
          workspaceResponse.groups = groups || [];
          return workspaceResponse;
        });
        userResponse.workspaces = workspaces || [];
        return userResponse;
      });
      return !id ? userResponses || [] : userResponses && userResponses.length > 0 ? userResponses[0] : [];
    }, manager);
  }

  async createUser(userDto: CreateUserDto) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const { name, email, password, status, workspaces } = userDto;

      const [firstName, lastName] = name.split(' ');

      // Generate a password if not provided
      const userPassword = password || this.generateRandomPassword();

      const newUser = manager.create(User, {
        firstName,
        lastName,
        email,
        password: userPassword,
        status: status || Status.ARCHIVED,
      });

      await manager.save(User, newUser);

      for (const workspace of workspaces) {
        let organization = null;

        if (workspace.id) {
          organization = await manager.findOne(Organization, { where: { id: workspace.id } });
        } else if (workspace.name) {
          organization = await manager.findOne(Organization, { where: { name: workspace.name } });
        }

        if (!organization) {
          throw new BadRequestException(
            `The workspaces id or name do not exist: id ${workspace.id}, name ${workspace.name}`
          );
        }

        const organizationUser = manager.create(OrganizationUser, {
          userId: newUser.id,
          organizationId: organization.id,
          status: workspace?.status || Status.ARCHIVED,
          role: 'all-users',
        });

        await manager.save(OrganizationUser, organizationUser);

        let groups = workspace.groups;

        if (!groups || groups.length === 0) {
          groups = [{ name: 'all_users' }];
        }

        for (const group of groups) {
          let groupPermission = null;

          if (group.id) {
            groupPermission = await manager.findOne(GroupPermission, { where: { id: group.id } });
          } else if (group.name) {
            groupPermission = await manager.findOne(GroupPermission, {
              where: { group: group.name, organizationId: organization.id },
            });
          }

          if (!groupPermission) {
            throw new BadRequestException(`Group permission id or name not found: id ${group.id}, name ${group.name}`);
          }

          // Associate user with group permission
          await manager.save(UserGroupPermission, {
            userId: newUser.id,
            groupPermissionId: groupPermission.id,
          });
        }
      }

      return await this.getAllUsers(newUser.id, manager);
    });
  }

  async updateUser(id: string, updateDto: UpdateUserDto) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const user = await manager.findOne(User, { where: { id } });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const { name, email, password, status } = updateDto;

      const userUpdateParams: Partial<User> = {};

      if (name) {
        const [firstName, lastName] = name.split(' ');
        userUpdateParams.firstName = firstName;
        userUpdateParams.lastName = lastName;
      }

      if (email) {
        userUpdateParams.email = email;
      }

      if (password) {
        userUpdateParams.password = password;
      }

      if (status) {
        userUpdateParams.status = status;
      }

      await manager.update(User, { id: user.id }, userUpdateParams);

      return;
    });
  }

  async replaceUserAllWorkspacesRelations(userId: string, workspacesDto: WorkspaceDto[]) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const user = await manager.findOne(User, { where: { id: userId } });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Remove existing group permissions for the user from all workspaces
      await manager.delete(UserGroupPermission, { userId });

      // Remove existing organization user records for the user
      await manager.delete(OrganizationUser, { userId });

      for (const workspace of workspacesDto) {
        let organization = null;

        if (workspace.id) {
          organization = await manager.findOne(Organization, { where: { id: workspace.id } });
        } else if (workspace.name) {
          organization = await manager.findOne(Organization, { where: { name: workspace.name } });
        }

        if (!organization) {
          throw new BadRequestException(
            `The workspaces id or name do not exist: id ${workspace.id}, name ${workspace.name}`
          );
        }

        const organizationUser = manager.create(OrganizationUser, {
          userId: userId,
          organizationId: organization.id,
          status: workspace.status || Status.ARCHIVED,
          role: 'all-users',
        });

        await manager.save(OrganizationUser, organizationUser);

        const groups = !workspace.groups || workspace.groups.length === 0 ? [{ name: 'all_users' }] : workspace.groups;

        for (const group of groups) {
          let groupPermission = null;

          if (group.id) {
            groupPermission = await manager.findOne(GroupPermission, {
              where: { id: group.id, organizationId: organization.id },
            });
          } else if (group.name) {
            groupPermission = await manager.findOne(GroupPermission, {
              where: { group: group.name, organizationId: organization.id },
            });
          }

          if (!groupPermission) {
            throw new BadRequestException(`Group permission id or name not found: id ${group.id}, name ${group.name}`);
          }

          // Associate user with group permission
          await manager.save(UserGroupPermission, {
            userId: userId,
            groupPermissionId: groupPermission.id,
          });
        }
      }

      return;
    });
  }

  async replaceUserWorkspaceRelations(userId: string, workspaceId: string, workspaceDto: UpdateGivenWorkspaceDto) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const query = manager
        .createQueryBuilder(OrganizationUser, 'organizationUser')
        .innerJoin('organizationUser.organization', 'organization', 'organization.status = :active', {
          active: 'active',
        })
        .where('organizationUser.userId = :userId', { userId })
        .andWhere('organizationUser.organizationId = :workspaceId', { workspaceId });

      const organizationUser = await query.getOne();

      if (!organizationUser) {
        throw new NotFoundException('User not found');
      }

      if (workspaceDto.status && organizationUser.status !== workspaceDto.status) {
        await manager.update(OrganizationUser, { status: workspaceDto.status }, { id: organizationUser.id });
      }

      if (workspaceDto.groups && workspaceDto.groups.length > 0) {
        // Remove existing group permissions for the user in this workspace
        await manager
          .createQueryBuilder()
          .delete()
          .from(UserGroupPermission)
          .where('userId = :userId', { userId })
          .andWhere('groupPermissionId IN (SELECT id FROM group_permissions WHERE organization_id = :organizationId)', {
            organizationId: workspaceId,
          })
          .execute();

        // Add to groups
        for (const group of workspaceDto.groups) {
          let groupPermission = null;

          if (group.id) {
            groupPermission = await manager.findOne(GroupPermission, {
              where: { id: group.id, organizationId: workspaceId },
            });
          } else if (group.name) {
            groupPermission = await manager.findOne(GroupPermission, {
              where: { group: group.name, organizationId: workspaceId },
            });
          }

          if (!groupPermission) {
            throw new BadRequestException(`Group permission id or name not found: id ${group.id}, name ${group.name}`);
          }

          // Associate user with group permission
          await manager.save(UserGroupPermission, {
            userId: userId,
            groupPermissionId: groupPermission.id,
          });
        }
      }

      return;
    });
  }

  async getAllWorkspaces() {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const workspaces: Organization[] = await manager.find(Organization, {
        where: { status: 'active' },
        relations: ['groupPermissions'],
      });

      const workspaceResponses = workspaces.map((workspace: Organization) => {
        return {
          id: workspace.id,
          name: workspace.name,
          status: workspace.status,
          groups:
            workspace?.groupPermissions?.map((groupPermission: GroupPermission) => {
              return {
                id: groupPermission.id,
                name: groupPermission.group,
              };
            }) || [],
        };
      });

      return workspaceResponses;
    });
  }
}
