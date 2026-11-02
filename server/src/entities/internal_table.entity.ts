import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
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
  // CASCADE the chain away — including the drop itself. @DeleteDateColumn makes every find* and
  // entity-targeted QueryBuilder exclude dropped rows automatically; raw joins against this table
  // (relation-resolver.service.ts) still need `it.deleted_at IS NULL` added by hand.
  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Organization, (organization) => organization.id)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;
}
