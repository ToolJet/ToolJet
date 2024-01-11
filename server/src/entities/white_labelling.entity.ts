import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Organization } from './organization.entity';

@Entity('white_labelling')
@Unique(['organizationId'])
export class WhiteLabelling {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organizationId' })
  organizationId: string;

  @OneToOne(() => Organization, (organization) => organization.whiteLabelling)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ type: 'varchar', length: 255 })
  logo: string;

  @Column({ type: 'varchar', length: 50 })
  text: string;

  @Column({ type: 'varchar', length: 255 })
  favicon: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' })
  updatedAt: Date;

  @Column({
    type: 'enum',
    enum: ['ACTIVE', 'INACTIVE'],
    default: () => 'ACTIVE',
  })
  status: 'ACTIVE' | 'INACTIVE';
}
