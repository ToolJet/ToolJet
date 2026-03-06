import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { DataSourceOptions } from './data_source_options.entity';

@Entity({ name: 'datasource_user_token_data' })
export class DatasourceUserTokenData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true, type: 'uuid' })
  userId: string | null;

  @Column({ name: 'data_source_option_id', type: 'uuid' })
  dataSourceOptionId: string;

  @Column({ name: 'auth_token', nullable: true, type: 'text' })
  authToken: string | null;

  @Column({ name: 'refresh_token', nullable: true, type: 'text' })
  refreshToken: string | null;

  @Column({ name: 'more_details', type: 'jsonb', default: '{}' })
  moreDetails: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', default: () => 'now()' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', default: () => 'now()' })
  updatedAt: Date;

  @OneToOne(() => DataSourceOptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'data_source_option_id' })
  dataSourceOption: DataSourceOptions;
}
