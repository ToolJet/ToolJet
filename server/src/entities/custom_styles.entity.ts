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

@Entity({ name: 'custom_styles' })
export class CustomStyles extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'styles' })
  styles: string;

  @Column({ name: 'organization_id', unique: true })
  organizationId: string;

  @Column({
    type: 'enum',
    enumName: 'custom_styles_scope_enum',
    name: 'scope',
    enum: ['instance', 'workspace'],
    default: 'workspace',
  })
  scope: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Organization, (organization) => organization.id)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;
}
