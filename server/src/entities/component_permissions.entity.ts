import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { Component } from './component.entity';
import { PAGE_PERMISSION_TYPE } from '@modules/app-permissions/constants';
import { ComponentUser } from './component_users.entity';

@Entity('component_permissions')
export class ComponentPermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'component_id', type: 'uuid', nullable: false })
  componentId: string;

  @Column({
    type: 'enum',
    enum: PAGE_PERMISSION_TYPE,
  })
  type: PAGE_PERMISSION_TYPE;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Component, (component) => component.permissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'component_id' })
  component: Component;

  @OneToMany(() => ComponentUser, (componentUser) => componentUser.componentPermission)
  users: ComponentUser[];
}
