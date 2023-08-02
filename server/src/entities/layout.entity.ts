import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Component } from './component.entity';

@Entity({ name: 'layouts' })
export class Layout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'type' })
  type: string;

  @Column({ name: 'top' })
  top: number;

  @Column({ name: 'left' })
  left: number;

  @Column({ name: 'component_id' })
  ComponentId: string;

  @ManyToOne(() => Component, (component) => component.layouts)
  component: Component;
}
