import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { Page } from './page.entity';
import { PageUser } from './page_users.entity';
import { PAGE_PERMISSION_TYPE } from '@modules/app-permissions/constants';

@Entity('page_permissions')
export class PagePermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'page_id', type: 'uuid', nullable: false })
  pageId: string;

  @Column({
    type: 'enum',
    enum: PAGE_PERMISSION_TYPE,
  })
  type: PAGE_PERMISSION_TYPE;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Page, (page) => page.permissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'page_id' })
  page: Page;

  @OneToMany(() => PageUser, (pageUser) => pageUser.pagePermission)
  users: PageUser[];
}
