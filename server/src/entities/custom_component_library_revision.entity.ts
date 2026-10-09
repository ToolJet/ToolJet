import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, BaseEntity, JoinColumn, ManyToOne } from 'typeorm';
import { CustomComponentLibrary } from '@entities/custom_component_library.entity';

// Immutable: published once, never edited — hence no UpdateDateColumn.
@Entity({ name: 'custom_component_library_revisions' })
export class CustomComponentLibraryRevision extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'library_id' })
  libraryId: string;

  @Column()
  version: string; // 'v1', 'v2', ...

  @Column({ name: 'bundle_url' })
  bundleUrl: string; // StorageService path, not bytes

  @Column({ name: 'css_url', nullable: true })
  cssUrl: string;

  @Column('jsonb')
  manifest: Record<string, any>;

  @Column({ nullable: true })
  message: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => CustomComponentLibrary, (library) => library.id)
  @JoinColumn({ name: 'library_id' })
  library: CustomComponentLibrary;
}
