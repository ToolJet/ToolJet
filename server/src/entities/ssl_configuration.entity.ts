import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
} from 'typeorm';

@Entity({ name: 'ssl_configurations' })
export class SslConfiguration extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'enabled', default: false })
  enabled: boolean;

  @Column({ name: 'email', default: '' })
  email: string;

  @Column({ name: 'staging', default: false })
  staging: boolean;

  @Column({ name: 'domain', nullable: true })
  domain: string;

  @Column({ name: 'fullchain_pem', type: 'text', nullable: true })
  fullchainPem: string;

  @Column({ name: 'privkey_pem', type: 'text', nullable: true })
  privkeyPem: string;

  @Column({ name: 'cert_pem', type: 'text', nullable: true })
  certPem: string;

  @Column({ name: 'chain_pem', type: 'text', nullable: true })
  chainPem: string;

  @Column({ name: 'acquired_at', nullable: true })
  acquiredAt: Date;

  @Column({ name: 'expires_at', nullable: true })
  expiresAt: Date;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;
}
