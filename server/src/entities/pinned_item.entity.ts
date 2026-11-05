import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

// Exactly one of appId / folderId is set (chk_pinned_items_one_resource). Two FK columns
// instead of resource_type + resource_id so deleting the app/folder cascades the pin.
@Entity({ name: 'pinned_items' })
export class PinnedItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  // No organization_id: a branch belongs to exactly one workspace and cascades with it.
  @Column({ name: 'branch_id', type: 'uuid' })
  branchId: string;

  @Column({ name: 'app_id', type: 'uuid', nullable: true })
  appId: string | null;

  @Column({ name: 'folder_id', type: 'uuid', nullable: true })
  folderId: string | null;

  @Column({ type: 'int' })
  position: number;

  @CreateDateColumn({ name: 'pinned_at', default: () => 'now()' })
  pinnedAt: Date;
}
