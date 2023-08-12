import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Page } from './page.entity';
import { Layout } from './layout.entity';

@Entity({ name: 'components' })
export class Component {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'type' })
  type: string;

  @Column({ name: 'page_id' })
  pageId: string;

  @Column('simple-json')
  properties: any;

  @Column('simple-json')
  styles: any;

  @Column('simple-json')
  validations: any;

  @ManyToOne(() => Page, (page) => page.components)
  @JoinColumn({ name: 'page_id' })
  page: Page;

  @OneToMany(() => Layout, (layout) => layout.component)
  layouts: Layout[];
}
