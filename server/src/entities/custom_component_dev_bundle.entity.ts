import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, JoinColumn, ManyToOne } from 'typeorm';
import { CustomComponentLibrary } from '@entities/custom_component_library.entity';
import { User } from '@entities/user.entity';

// One mutable slot per (library, developer) — overwritten on every `tooljet component dev` save.
@Entity({ name: 'custom_component_dev_bundles' })
export class CustomComponentDevBundle extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'library_id' })
  libraryId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'bundle_url' })
  bundleUrl: string;

  @Column({ name: 'css_url', nullable: true })
  cssUrl: string;

  @Column('jsonb')
  manifest: Record<string, any>;

  // Plain column (not CreateDateColumn): bumped by the service on every overwrite
  @Column({ type: 'timestamptz', name: 'uploaded_at', default: () => 'now()' })
  uploadedAt: Date;

  @ManyToOne(() => CustomComponentLibrary, (library) => library.id)
  @JoinColumn({ name: 'library_id' })
  library: CustomComponentLibrary;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
