import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BaseEntity,
} from 'typeorm';
import { Organization } from './organization.entity';
import { User } from './user.entity';

@Entity({ name: 'organization_users' })
export class OrganizationUser extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  role: string;

  @Column({
    type: 'enum',
    enumName: 'status',
    enum: ['invited', 'active', 'archived'],
  })
  status: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Organization, (organization) => organization.id)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
