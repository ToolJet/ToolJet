import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  JoinColumn,
  ManyToOne,
  AfterLoad,
} from 'typeorm';
import { Organization } from '@entities/organization.entity';
import { Definition } from '@modules/organization-themes/dto';
import { isShippedTheme } from '@modules/organization-themes/constants/shipped-themes';
@Entity({ name: 'organization_themes' })
export class OrganizationThemes extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column('json')
  definition: Definition;

  @Column({ default: false, name: 'is_default' })
  isDefault: boolean;

  @Column({ default: false, name: 'is_basic' })
  isBasic: boolean;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Organization, (organization) => organization.id)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  isDisabled: boolean;

  // Not a column: whether this is the workspace's copy of a shipped theme, which every plan can apply.
  isShipped: boolean;

  @AfterLoad()
  markShipped() {
    this.isShipped = isShippedTheme(this);
  }
}
