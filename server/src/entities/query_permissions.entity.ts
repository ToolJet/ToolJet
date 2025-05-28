import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { DataQuery } from './data_query.entity';
import { QueryUser } from './query_users.entity';
import { PAGE_PERMISSION_TYPE } from '@modules/app-permissions/constants';

@Entity('query_permissions')
export class QueryPermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'query_id', type: 'uuid', nullable: false })
  queryId: string;

  @Column({
    type: 'enum',
    enum: PAGE_PERMISSION_TYPE,
  })
  type: PAGE_PERMISSION_TYPE;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => DataQuery, (query) => query.permissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'query_id' })
  query: DataQuery;

  @OneToMany(() => QueryUser, (queryUser) => queryUser.queryPermission)
  users: QueryUser[];
}
