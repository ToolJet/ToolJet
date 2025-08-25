import {
  Entity,
  OneToOne,
  Column,
  CreateDateColumn,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  BaseEntity,
} from 'typeorm';
import { AppVersion } from './app_version.entity';
import { AppGitSync } from './app_git_sync.entity';
import { GroupPermission } from './group_permission.entity';
import { User } from './user.entity';
import { GroupApps } from './group_apps.entity';
import { AppGroupPermission } from './app_group_permission.entity';
import { AiConversation } from './ai_conversation.entity';
import { Organization } from './organization.entity';
import { APP_TYPES } from '@modules/apps/constants';

@Entity({ name: 'apps' })
export class App extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'type',
    type: 'enum',
    enum: APP_TYPES,
    default: APP_TYPES.FRONT_END,
  })
  type: APP_TYPES;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'slug', unique: true })
  slug: string;

  @Column({ name: 'is_public', default: true })
  isPublic: boolean;

  @Column({ name: 'is_maintenance_on', default: false })
  isMaintenanceOn: boolean;

  @Column({ name: 'icon' })
  icon: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'current_version_id' })
  currentVersionId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'workflow_api_token' })
  workflowApiToken: string;

  @Column({ name: 'workflow_enabled', default: false })
  workflowEnabled: boolean;

  @Column({ name: 'is_initialised_from_prompt', default: false })
  isInitialisedFromPrompt: boolean;

  @Column({ name: 'app_generated_from_prompt', default: false })
  appGeneratedFromPrompt: boolean;

  @Column({
    type: 'enum',
    enumName: 'app_builder_mode',
    name: 'app_builder_mode',
    enum: ['ai', 'visual'],
    default: 'visual',
  })
  appBuilderMode: string;

  @Column({ name: 'ai_generation_metadata', type: 'jsonb', nullable: true })
  aiGenerationMetadata: {
    steps: {
      name: string;
      id: string;
      loadingStates: string[];
    }[];
    appInitialisationPrompt?: string;
    appName?: string;
    completedSteps: string[];
    activeStep: string;
    version: string;
    dataSource: {
      kind: string;
      name: string;
      id: string;
    }
  };

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @Column({
    type: 'enum',
    enumName: 'app_creation_mode',
    name: 'creation_mode',
    enum: ['GIT', 'DEFAULT'],
    default: 'DEFAULT',
  })
  creationMode: string;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => AppVersion, (appVersion) => appVersion.app, {
    onDelete: 'CASCADE',
  })
  appVersions: AppVersion[];

  //Depreciated
  @ManyToMany(() => GroupPermission)
  @JoinTable({
    name: 'app_group_permissions',
    joinColumn: {
      name: 'app_id',
    },
    inverseJoinColumn: {
      name: 'group_permission_id',
    },
  })
  groupPermissions: GroupPermission[];

  @OneToOne(() => AppGitSync, (appGitSync) => appGitSync.app, { onDelete: 'CASCADE' })
  appGitSync: AppGitSync;

  @OneToMany(() => GroupApps, (groupApps) => groupApps.app, { onDelete: 'CASCADE' })
  appGroups: GroupApps[];

  //Depreciated
  @OneToMany(() => AppGroupPermission, (appGroupPermission) => appGroupPermission.app, { onDelete: 'CASCADE' })
  appGroupPermissions: AppGroupPermission[];

  @OneToMany(() => AiConversation, (aiConversation) => aiConversation.app, { onDelete: 'CASCADE' })
  aiConversations: AiConversation[];

  public editingVersion;
}
