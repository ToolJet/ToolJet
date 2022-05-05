import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
  BaseEntity,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { GroupPermission } from './group_permission.entity';
const bcrypt = require('bcrypt');
import { OrganizationUser } from './organization_user.entity';
import { UserGroupPermission } from './user_group_permission.entity';

@Entity({ name: 'users' })
export class User extends BaseEntity {
  @BeforeInsert()
  @BeforeUpdate()
  hashPassword(): void {
    if (this.password) {
      this.password = bcrypt.hashSync(this.password, 10);
    }
  }

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column()
  email: string;

  @Column({ name: 'invitation_token' })
  invitationToken: string;

  @Column({ name: 'forgot_password_token' })
  forgotPasswordToken: string;

  @Column({ name: 'password_digest' })
  password: string;

  @Column({ name: 'organization_id' })
  defaultOrganizationId: string;

  @Column({ name: 'role' })
  role: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => OrganizationUser, (organizationUser) => organizationUser.user, { eager: true })
  organizationUsers: OrganizationUser[];

  @ManyToMany(() => GroupPermission)
  @JoinTable({
    name: 'user_group_permissions',
    joinColumn: {
      name: 'user_id',
    },
    inverseJoinColumn: {
      name: 'group_permission_id',
    },
  })
  groupPermissions: Promise<GroupPermission[]>;

  @OneToMany(() => UserGroupPermission, (userGroupPermission) => userGroupPermission.user, { onDelete: 'CASCADE' })
  userGroupPermissions: UserGroupPermission[];

  organizationId: string;
  isPasswordLogin: boolean;
}
