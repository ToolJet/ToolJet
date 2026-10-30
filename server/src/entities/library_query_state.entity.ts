import { BaseEntity, Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

// Draft/release pointers for a library query. Rows are created lazily; a missing row means
// { hasDraft: true, releasedVersionId: null }.
@Entity({ name: 'library_query_states' })
export class LibraryQueryState extends BaseEntity {
  @PrimaryColumn({ name: 'library_query_id', type: 'uuid' })
  libraryQueryId: string;

  @Column({ name: 'has_draft', type: 'boolean', default: true })
  hasDraft: boolean;

  @Column({ name: 'draft_created_from_version_id', type: 'uuid', nullable: true })
  draftCreatedFromVersionId: string | null;

  @Column({ name: 'draft_description', type: 'varchar', nullable: true })
  draftDescription: string | null;

  @Column({ name: 'released_version_id', type: 'uuid', nullable: true })
  releasedVersionId: string | null;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;
}
