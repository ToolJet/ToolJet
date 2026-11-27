import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'library_queries' })
@Unique('UQ_library_queries_workspace_name', ['organizationId', 'name'])
// Import matches by co_relation_id first, so one workspace never holds two copies of the same exported query.
@Unique('UQ_library_queries_workspace_co_relation', ['organizationId', 'coRelationId'])
export class LibraryQuery extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @Column()
  name: string;

  @Column({ name: 'folder_id', type: 'uuid', nullable: true })
  folderId: string | null;

  @Column({ name: 'co_relation_id', type: 'uuid', nullable: true })
  coRelationId: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ name: 'created_at', default: () => 'now()' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', default: () => 'now()' })
  updatedAt: Date;
}
