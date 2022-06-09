import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { File } from 'src/entities//file.entity';
import { Organization } from 'src/entities/organization.entity';

@Entity({ name: 'extensions' })
export class Extension {
  @PrimaryGeneratedColumn()
  public id: string;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'version' })
  version: string;

  @Column({ name: 'operations_file_id' })
  operationsFileId: string;

  @Column({ name: 'icon_file_id' })
  iconFileId: string;

  @Column({ name: 'manifest_file_id' })
  manifestFileId: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => File, (file) => file.id)
  @JoinColumn({ name: 'operations_file_id' })
  operationsFile?: File;

  @OneToOne(() => File, (file) => file.id)
  @JoinColumn({ name: 'icon_file_id' })
  iconFile?: File;

  @OneToOne(() => File, (file) => file.id)
  @JoinColumn({ name: 'manifest_file_id' })
  manifestFile?: File;

  @OneToMany(() => Organization, (organization) => organization.id)
  organizations: Organization[];
}
