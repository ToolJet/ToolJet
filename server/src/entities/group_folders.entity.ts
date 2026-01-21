import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Folder } from './folder.entity';
import { FoldersGroupPermissions } from './folders_group_permissions.entity';

@Entity({ name: 'group_folders' })
@Unique(['folderId', 'foldersGroupPermissionsId'])
export class GroupFolders extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'folder_id' })
  folderId: string;

  @Column({ name: 'folders_group_permissions_id' })
  foldersGroupPermissionsId: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Folder, (folder) => folder.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'folder_id' })
  folder: Folder;

  @ManyToOne(() => FoldersGroupPermissions, (foldersPermissions) => foldersPermissions.groupFolders, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'folders_group_permissions_id' })
  foldersGroupPermissions: FoldersGroupPermissions;
}
