import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: "metadata" })
export class Metadata {

  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column('simple-json', { name: 'data' }) 
  data

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;
  
  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;


}
