import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Folder } from './folder.entity';
import { DsFoldersGroupPermissions } from './ds_folders_group_permissions.entity';

@Entity({ name: 'group_ds_folders' })
export class GroupDsFolders extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ds_folders_group_permissions_id' })
  dsFoldersGroupPermissionsId: string;

  @Column({ name: 'folder_id' })
  folderId: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => DsFoldersGroupPermissions, (dsFolderPermissions) => dsFolderPermissions.id)
  @JoinColumn({ name: 'ds_folders_group_permissions_id' })
  dsFoldersGroupPermissions: DsFoldersGroupPermissions;

  @ManyToOne(() => Folder, (folder) => folder.id)
  @JoinColumn({ name: 'folder_id' })
  folder: Folder;
}
