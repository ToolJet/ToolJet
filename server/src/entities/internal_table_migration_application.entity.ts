import { Entity, Column, PrimaryGeneratedColumn, BaseEntity } from 'typeorm';

@Entity({ name: 'internal_table_migration_applications' })
export class InternalTableMigrationApplication extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'migration_id' })
  migrationId: string;

  @Column({ name: 'relation_id' })
  relationId: string;

  // NULL means pending: applied in the app DB, not yet confirmed against the ToolJet Database.
  // Every applied-set read must filter these out.
  @Column({ name: 'applied_at', type: 'timestamp', nullable: true })
  appliedAt: Date | null;
}
