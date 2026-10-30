import { BaseEntity, Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

// The released saved-version pointer for one query.
@Entity({ name: 'library_query_states' })
export class LibraryQueryState extends BaseEntity {
  @PrimaryColumn({ name: 'library_query_id', type: 'uuid' })
  libraryQueryId: string;

  @Column({ name: 'released_version_id', type: 'uuid', nullable: true })
  releasedVersionId: string | null;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;
}
