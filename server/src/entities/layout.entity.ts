import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import { Component } from './component.entity';

@Entity({ name: 'layouts' })
export class Layout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enumName: 'layout_type', enum: ['desktop', 'mobile'] })
  type: string;

  @Column({ type: 'double precision' })
  top: number;

  @Column({ type: 'double precision' })
  left: number;

  @Column({ type: 'double precision' })
  width: number;

  @Column({ type: 'double precision' })
  height: number;

  @Column({ name: 'component_id' })
  componentId: string;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Component, (component) => component.layouts)
  @JoinColumn({ name: 'component_id' })
  component: Component;
}
