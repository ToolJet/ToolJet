import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BaseEntity } from 'typeorm';

@Entity({ name: 'instance_settings' })
export class InstanceSettings extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  label: string;

  @Column({ name: 'label_key' })
  labelKey: string;

  @Column({ unique: true })
  key: string;

  @Column()
  value: string;

  @Column({ name: 'data_type' })
  dataType: string;

  @Column({ name: 'helper_text' })
  helperText: string;

  @Column({ name: 'helper_text_key' })
  helperTextKey: string;

  @Column({ name: 'type', type: 'enum', enumName: 'settings_type', enum: ['user', 'system'], default: 'user' })
  type: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;
}
