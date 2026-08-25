import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Organization } from './organization.entity';

@Entity({ name: 'internal_tables' })
export class InternalTable extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'table_name' })
  tableName: string;

  @Column({ name: 'co_relation_id' })
  co_relation_id: string;

  // Soft delete: drop_table is a migration in the chain, so hard-deleting the registry row would
  // CASCADE the chain away — including the drop itself. Nothing sets this yet (H7 does).
  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Organization, (organization) => organization.id)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;
}
