import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GranularPermissions } from './granular_permissions.entity';
import { GroupDsFolders } from './group_ds_folder.entity';

@Entity({ name: 'ds_folders_group_permissions' })
export class DsFoldersGroupPermissions extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'granular_permission_id' })
  granularPermissionId: string;

  @Column({ name: 'can_edit_folder', nullable: false, default: false })
  canEditFolder: boolean;

  @Column({ name: 'can_configure_ds', nullable: false, default: false })
  canConfigureDs: boolean;

  @Column({ name: 'can_use_ds', nullable: false, default: false })
  canUseDs: boolean;

  @Column({ name: 'can_run_query', nullable: false, default: true })
  canRunQuery: boolean;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => GranularPermissions, (granularPermission) => granularPermission.id)
  @JoinColumn({ name: 'granular_permission_id' })
  granularPermissions: GranularPermissions;

  @OneToMany(() => GroupDsFolders, (groupDsFolder) => groupDsFolder.dsFoldersGroupPermissions, {
    onDelete: 'CASCADE',
  })
  groupDsFolders: GroupDsFolders[];
}
