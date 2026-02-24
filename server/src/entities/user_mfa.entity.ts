import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('user_mfa')
export class UserMfa {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  identifier: string; // email or phone

  @Column({ type: 'varchar', default: 'email_otp' })
  type: string;

  @Column({ type: 'int', default: 0 })
  resend_count: number;

  @Column({ type: 'timestamptz', nullable: true })
  last_sent_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
