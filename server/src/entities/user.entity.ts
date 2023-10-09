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
  OneToOne,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { App } from './app.entity';
import { GroupPermission } from './group_permission.entity';
const bcrypt = require('bcrypt');
import { OrganizationUser } from './organization_user.entity';
import { UserGroupPermission } from './user_group_permission.entity';
import { File } from './file.entity';
import { Organization } from './organization.entity';
import { UserDetails } from './user_details.entity';

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

  @Column({ name: 'phone_number' })
  phoneNumber: string;

  @Column({
    type: 'enum',
    enumName: 'status',
    name: 'status',
    enum: ['invited', 'verified', 'active', 'archived'],
    default: 'invited',
  })
  status: string;

  @Column({
    type: 'enum',
    enumName: 'source',
    name: 'source',
    enum: ['signup', 'invite', 'google', 'git', 'ldap', 'saml'],
    default: 'invite',
  })
  source: string;

  @Column({
    type: 'enum',
    enumName: 'user_type',
    name: 'user_type',
    enum: ['instance', 'workspace'],
    default: 'workspace',
  })
  userType: string;

  @Column({ name: 'avatar_id', nullable: true, default: null })
  avatarId?: string;

  @Column({ name: 'invitation_token' })
  invitationToken: string;

  @Column({ name: 'forgot_password_token' })
  forgotPasswordToken: string;

  @Column({ name: 'password_digest' })
  password: string;

  @Column({ name: 'organization_id' })
  defaultOrganizationId: string;

  @Column({ name: 'company_name' })
  companyName: string;

  @Column({ name: 'role' })
  role: string;

  @Column({ name: 'company_size' })
  companySize: string;

  @Column({ name: 'password_retry_count' })
  passwordRetryCount: number;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => OrganizationUser, (organizationUser) => organizationUser.user, { eager: true })
  organizationUsers: OrganizationUser[];

  @ManyToOne(() => Organization, (organization) => organization.id)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @JoinColumn({ name: 'avatar_id' })
  @OneToOne(() => File, {
    nullable: true,
  })
  avatar?: File;

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

  @OneToMany(() => App, (app) => app.user)
  apps: App[];

  @OneToOne(() => UserDetails, (details) => details.user, { eager: true })
  userDetails: UserDetails;

  organizationId: string;
  organizationIds?: Array<string>;
  isPasswordLogin: boolean;
  isSSOLogin: boolean;
  sessionId: string;
}
