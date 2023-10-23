import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Page } from './page.entity';
import { Layout } from './layout.entity';

@Entity({ name: 'components' })
@Index('idx_component_page_id', ['pageId'])
export class Component {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  type: string;

  @Column({ name: 'page_id' })
  pageId: string;

  @Column({ nullable: true })
  parent: string;

  @Column('simple-json')
  properties: any;

  @Column('simple-json', { name: 'general_properties', nullable: true })
  general: any;

  @Column('simple-json')
  styles: any;

  @Column('simple-json', { name: 'general_styles', nullable: true })
  generalStyles: any;

  @Column('simple-json', { name: 'display_preferences', nullable: true })
  displayPreferences: any;

  @Column('simple-json')
  validation: any;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Page, (page) => page.components)
  @JoinColumn({ name: 'page_id' })
  page: Page;

  @OneToMany(() => Layout, (layout) => layout.component)
  layouts: Layout[];
}
