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
import { File } from './file.entity';
import { Organization } from './organization.entity';
import { UserDetails } from './user_details.entity';
import { GroupUsers } from './group_users.entity';
import { UserGroupPermission } from './user_group_permission.entity';
import { GroupPermissions } from './group_permissions.entity';
import { OnboardingDetails } from './onboarding_details.entity';
import { OnboardingStatus } from '@modules/onboarding/constants';
import { AiConversation } from './ai_conversation.entity';
import { AiResponseVote } from './ai_response_vote.entity';
import { USER_ROLE } from '@modules/group-permissions/constants';

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
    enum: ['signup', 'invite', 'google', 'git', 'ldap', 'saml', 'workspace_signup'],
    default: 'invite',
  })
  source: string;

  @Column({
    type: 'enum',
    enumName: 'onboarding_status',
    name: 'onboarding_status',
    enum: OnboardingStatus,
    default: OnboardingStatus.NOT_STARTED,
  })
  onboardingStatus: OnboardingStatus;

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

  //Depreciated
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
  groupPermissions: GroupPermission[];

  @ManyToMany(() => GroupPermissions)
  @JoinTable({
    name: 'group_users',
    joinColumn: {
      name: 'user_id',
    },
    inverseJoinColumn: {
      name: 'group_id',
    },
  })
  userPermissions: GroupPermissions[];

  @OneToMany(() => GroupUsers, (groupUsers) => groupUsers.user, { onDelete: 'CASCADE' })
  userGroups: GroupUsers[];

  //Depreciated
  @OneToMany(() => UserGroupPermission, (userGroupPermission) => userGroupPermission.user, { onDelete: 'CASCADE' })
  userGroupPermissions: UserGroupPermission[];

  @OneToMany(() => App, (app) => app.user)
  apps: App[];

  @OneToMany(() => UserDetails, (userDetails) => userDetails.user)
  userDetails: UserDetails[];

  @OneToOne(() => OnboardingDetails, (onboardingDetails) => onboardingDetails.user, { lazy: true })
  onboardingDetails: Promise<OnboardingDetails>;

  @OneToMany(() => AiConversation, (aiConversation) => aiConversation.user, { onDelete: 'CASCADE' })
  aiConversations: AiConversation[];

  @OneToMany(() => AiResponseVote, (aiResponseVote) => aiResponseVote.user, { onDelete: 'CASCADE' })
  aiResponseVotes: AiResponseVote[];

  organizationId: string;
  invitedOrganizationId: string;
  organizationIds?: Array<string>;
  isPasswordLogin: boolean;
  isSSOLogin: boolean;
  sessionId: string;
  roleGroup: USER_ROLE;
}
