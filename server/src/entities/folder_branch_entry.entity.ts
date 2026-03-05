import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Unique,
} from 'typeorm';
import { Folder } from './folder.entity';
import { WorkspaceBranch } from './workspace_branch.entity';
import { FolderAppBranchEntry } from './folder_app_branch_entry.entity';

@Entity({ name: 'folder_branch_entries' })
@Unique(['folderId', 'branchId'])
export class FolderBranchEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'folder_id' })
  folderId: string;

  @Column({ name: 'branch_id' })
  branchId: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ nullable: true })
  name: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Folder, (f) => f.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'folder_id' })
  folder: Folder;

  @ManyToOne(() => WorkspaceBranch, (wb) => wb.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branch_id' })
  branch: WorkspaceBranch;

  @OneToMany(() => FolderAppBranchEntry, (fabe) => fabe.folderBranchEntry)
  folderAppBranchEntries: FolderAppBranchEntry[];
}
