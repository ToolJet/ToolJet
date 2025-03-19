import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Organization } from './organization.entity';

@Entity('white_labelling')
//null values are unique, handle in migration to only allow a single row with null orgId (AddUniqueConstraintForNullOrganizationId)
//which will represent instance level white-labels
export class WhiteLabelling {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', unique: true })
  organizationId: string;

  @OneToOne(() => Organization, (organization) => organization.whiteLabelling)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ type: 'varchar', length: 255 })
  logo: string;

  @Column({ type: 'varchar', length: 50 })
  text: string;

  @Column({ type: 'varchar', length: 255 })
  favicon: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
    name: 'updated_at',
  })
  updatedAt: Date;

  @Column({
    type: 'enum',
    enum: ['ACTIVE', 'INACTIVE'],
    default: () => 'ACTIVE',
  })
  status: 'ACTIVE' | 'INACTIVE';
}
