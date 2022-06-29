import { User } from 'src/entities/user.entity';
import { GroupPermission } from 'src/entities/group_permission.entity';
import { EntityManager, MigrationInterface, QueryRunner, TableColumn, TableUnique } from 'typeorm';
import { UserGroupPermission } from 'src/entities/user_group_permission.entity';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { App } from 'src/entities/app.entity';
import { Thread } from 'src/entities/thread.entity';
import { Comment } from 'src/entities/comment.entity';

export class ConvertAllUserEmailsToLowercaseAndDeleteDuplicateUsers1654596810662 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const usersTable = await queryRunner.getTable('users');
    const columnUniques = usersTable.findColumnUniques(
      new TableColumn({
        name: 'email',
        type: 'string',
      })
    );
    await queryRunner.dropUniqueConstraint('users', columnUniques[0].name);

    const usersQuery = entityManager
      .getRepository(User)
      .createQueryBuilder('users')
      .leftJoinAndSelect('users.organizationUsers', 'organizationUsers')
      .leftJoinAndSelect('users.apps', 'apps')
      .leftJoinAndSelect('users.groupPermissions', 'groupPermissions')
      .leftJoinAndSelect('users.userGroupPermissions', 'userGroupPermissions')
      .leftJoinAndSelect('userGroupPermissions.groupPermission', 'groupPermission');

    const users = await usersQuery.getMany();

    //change all email addresses to lowercase
    await Promise.all(
      users.map(async (user) => {
        const { id, email } = user;
        if (this.hasUpperCase(email)) {
          await entityManager.update(
            User,
            { id: id },
            {
              email: email.toLowerCase(),
            }
          );
        }
      })
    );

    //merge or delete same users
    const deletedUsers = [];
    await (async () => {
      for (const user of users) {
        if (!deletedUsers.includes(user.id) && !user.invitationToken) {
          const { email } = user;
          const usersWithSameEmail = await usersQuery
            .where('users.email = :email', { email: email.toLowerCase() })
            .getMany();

          if (usersWithSameEmail.length > 0) {
            const originalUser = user;
            const usersToDelete = usersWithSameEmail.filter((user) => user.id !== originalUser.id);
            await this.migrateUsers(originalUser, usersToDelete, entityManager);
            usersToDelete.map((user) => {
              deletedUsers.push(user.id);
            });
          }
        }
      }
    })();

    await queryRunner.createUniqueConstraint(
      'users',
      new TableUnique({
        columnNames: ['email'],
      })
    );
  }

  private findOrgUsersNotInSameOrg = (deletingOrgUsers: OrganizationUser[], originalOrgUsers: OrganizationUser[]) => {
    return deletingOrgUsers.filter(
      (deletingOrgUser: OrganizationUser) =>
        !originalOrgUsers.some(
          (originalOrgUser: OrganizationUser) => deletingOrgUser.organizationId === originalOrgUser.organizationId
        )
    );
  };

  private async migrateUsers(originalUser: User, usersToDelete: User[], entityManager: EntityManager) {
    const { organizationUsers } = originalUser;

    await (async () => {
      for (const deletingUser of usersToDelete) {
        if (!deletingUser.invitationToken) {
          const onlyInDeleteUserOrgs = this.findOrgUsersNotInSameOrg(deletingUser.organizationUsers, organizationUsers);

          if (onlyInDeleteUserOrgs.length > 0) {
            // map other orgs to original user
            await (async () => {
              for (const orgnizationUser of onlyInDeleteUserOrgs) {
                await entityManager.update(OrganizationUser, orgnizationUser.id, {
                  user: originalUser,
                });
              }
            })();
          }

          //user group permissions
          await this.migrateUserGroupPermissions(entityManager, deletingUser, originalUser);

          //apps
          await Promise.all(
            deletingUser.apps.map(
              async (app) =>
                await entityManager.update(App, app.id, {
                  userId: originalUser.id,
                })
            )
          );

          //threads
          await this.migrateThreads(entityManager, deletingUser.id, originalUser);

          //comments
          await this.migrateComments(entityManager, deletingUser.id, originalUser);
        }

        //delete duplicate user
        await entityManager.delete(User, deletingUser.id);
      }
    })();
  }

  private async migrateUserGroupPermissions(entityManager: EntityManager, deletingUser: User, originalUser: User) {
    const origin_user_permissions = await originalUser.groupPermissions;
    await (async () => {
      for (const userGroupPermission of deletingUser.userGroupPermissions) {
        const deleting_group_permission = userGroupPermission.groupPermission;
        const original_group_permission = await this.checkPermissionIsExisted(
          origin_user_permissions,
          deleting_group_permission.organizationId,
          deleting_group_permission.group
        );

        if (!original_group_permission) {
          await this.updateUserGroupPermission(entityManager, userGroupPermission.id, originalUser.id);
        }
      }
    })();
  }

  private async migrateThreads(entityManager: EntityManager, deletingUserId: string, originalUser: User) {
    const threads = await entityManager.find(Thread, { userId: deletingUserId });
    return await Promise.all(
      threads.map(async (thread) => {
        await entityManager.update(Thread, thread.id, {
          user: originalUser,
        });
      })
    );
  }

  //error here
  private async migrateComments(entityManager: EntityManager, deletingUserId: string, originalUser: User) {
    const comments = await entityManager.find(Comment, { userId: deletingUserId });
    return await Promise.all(
      comments.map(async (comment) => {
        await entityManager.update(Comment, comment.id, {
          user: originalUser,
        });
      })
    );
  }

  private async updateUserGroupPermission(entityManager: EntityManager, userGroupPermissionId: string, userId: string) {
    return await entityManager.update(
      UserGroupPermission,
      {
        id: userGroupPermissionId,
      },
      { userId }
    );
  }

  private async checkPermissionIsExisted(permissions: GroupPermission[], organizationId: string, group: string) {
    let group_permission: GroupPermission = null;
    permissions.map((permission) => {
      if (permission.organizationId === organizationId && permission.group === group) {
        group_permission = permission;
        return;
      }
    });
    return group_permission;
  }

  private hasUpperCase(str: string) {
    return str.toLowerCase() !== str;
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
