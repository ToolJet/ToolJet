import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';

export enum ChildType {
  QUERY = 'query',
  FOLDER = 'folder',
}

@Entity({ name: 'data_query_folder_mappings' })
@Unique(['childId', 'childType'])
export class DataQueryFolderMapping {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'parent_id', nullable: true, type: 'uuid' })
  parentId: string | null;

  @Column({ name: 'child_id', type: 'uuid' })
  childId: string;

  @Column({ name: 'child_type', type: 'enum', enum: ChildType })
  childType: ChildType;

  @Column({ name: 'index', type: 'integer' })
  index: number;

  @Column({ name: 'co_relation_id', nullable: true })
  co_relation_id: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;
}
