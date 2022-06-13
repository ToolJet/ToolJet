import { User } from 'src/entities/user.entity';
import { GroupPermission } from 'src/entities/group_permission.entity';
import { EntityManager, MigrationInterface, QueryRunner, TableColumn, TableUnique } from 'typeorm';
import { UserGroupPermission } from 'src/entities/user_group_permission.entity';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { App } from 'src/entities/app.entity';
import { Thread } from 'src/entities/thread.entity';

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
      .leftJoinAndSelect('groupPermissions.appGroupPermission', 'appGroupPermission')
      .leftJoinAndSelect('groupPermissions.userGroupPermission', 'userGroupPermission');

    const users = await usersQuery.getMany();

    //change all email addresses to lowercase
    await Promise.all(
      users.map(async (user) => {
        console.log(user);

        const { id, email } = user;
        if (!this.isUpper(email)) {
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
    void (async () => {
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

    const us = await usersQuery.getMany();
    for (const user of us) {
      console.log(user);
    }

    throw Error('');
  }

  private async migrateUsers(originalUser: User, usersToDelete: User[], entityManager: EntityManager) {
    const { organizationUsers } = originalUser;
    const isSameOrganization = (a: any, b: any) => a.organizationId === b.organizationId;
    const onlyInLeft = (left: any, right: any, compareFunction) =>
      left.filter((leftValue: any) => !right.some((rightValue: any) => compareFunction(leftValue, rightValue)));

    void (async () => {
      for (const deletingUser of usersToDelete) {
        if (!deletingUser.invitationToken) {
          const onlyInDeleteUserOrgs = onlyInLeft(
            deletingUser.organizationUsers,
            organizationUsers,
            isSameOrganization
          );
          if (onlyInDeleteUserOrgs.length <= 0) {
            //check if the deleting user has the admin privillages
            await this.migratePermissions(entityManager, originalUser, deletingUser);
          } else {
            // map other org to original user
            void (async () => {
              for (const orgnizationUser of onlyInDeleteUserOrgs) {
                await entityManager.update(OrganizationUser, orgnizationUser.id, {
                  user: originalUser,
                });
              }
            })();
            await this.migratePermissions(entityManager, originalUser, deletingUser);
          }
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
          await this.migrateThreads(entityManager, deletingUser.id, originalUser.id);
        }

        //delete duplicate user
        await entityManager.delete(User, deletingUser.id);
      }
    })();
  }

  private async migrateThreads(entityManager: EntityManager, deletingUserId: string, originalUserId: string) {
    return await entityManager.connection
      .createQueryBuilder()
      .update(Thread)
      .set({ userId: originalUserId })
      .where({ id: deletingUserId })
      .execute();
  }

  private isUpper(str: string) {
    return !/[a-z]/.test(str) && /[A-Z]/.test(str);
  }

  private async checkIfUserHasAdminPrivilege(user: User): Promise<GroupPermission> {
    const permissions = await user.groupPermissions;
    let adminPermission = null;
    permissions.map((permission) => {
      if (permission.group === 'admin') {
        adminPermission = permission;
        return;
      }
    });
    return adminPermission;
  }

  private async getNonDefaultGroupsIfExisted(group_permissions: GroupPermission[]) {
    const groups = [];
    const defualts = ['admin', 'all_users'];
    group_permissions.map((group_permission) => {
      if (!defualts.includes(group_permission.group)) {
        groups.push(group_permission);
      }
    });
    return groups;
  }

  private async updateUserGroupPermissions(
    entityManager: EntityManager,
    user_permissions: UserGroupPermission[],
    originalUserId: string
  ) {
    return await Promise.all(
      user_permissions.map(
        async (user_group) =>
          await entityManager.update(UserGroupPermission, user_group.id, {
            userId: originalUserId,
          })
      )
    );
  }

  private async migratePermissions(entityManager: EntityManager, originalUser: User, deletingUser: User) {
    const deleteUserAdminPermission = await this.checkIfUserHasAdminPrivilege(originalUser);
    const originalUserAdminPermission = await this.checkIfUserHasAdminPrivilege(deletingUser);

    if (deleteUserAdminPermission && !originalUserAdminPermission) {
      //transfer admin privillages to original user
      return await this.updateUserGroupPermissions(
        entityManager,
        deleteUserAdminPermission.userGroupPermission,
        originalUser.id
      );
    } else {
      //check if both users havn't the admin privillages
      if (!deleteUserAdminPermission && !originalUserAdminPermission) {
        //then check if the deleting user has any new group permissions existed, then merge to original user
        const other_permissions = await this.getNonDefaultGroupsIfExisted(await deletingUser.groupPermissions);
        return await Promise.all(
          other_permissions.map(async (group_permission: GroupPermission) => {
            return await this.updateUserGroupPermissions(
              entityManager,
              group_permission.userGroupPermission,
              originalUser.id
            );
          })
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
