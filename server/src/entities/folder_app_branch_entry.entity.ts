import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { FolderBranchEntry } from './folder_branch_entry.entity';
import { App } from './app.entity';

@Entity({ name: 'folder_app_branch_entries' })
@Unique(['folderBranchEntryId', 'appId'])
export class FolderAppBranchEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'folder_branch_entry_id' })
  folderBranchEntryId: string;

  @Column({ name: 'app_id' })
  appId: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => FolderBranchEntry, (fbe) => fbe.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'folder_branch_entry_id' })
  folderBranchEntry: FolderBranchEntry;

  @ManyToOne(() => App, (app) => app.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'app_id' })
  app: App;
}
