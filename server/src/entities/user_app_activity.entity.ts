import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'user_app_activity' })
export class UserAppActivity {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @PrimaryColumn({ name: 'app_id', type: 'uuid' })
  appId: string;

  @PrimaryColumn({ name: 'branch_id', type: 'uuid' })
  branchId: string;

  @Column({ name: 'last_viewed_at', type: 'timestamp', nullable: true })
  lastViewedAt: Date | null;

  @Column({ name: 'last_edited_at', type: 'timestamp', nullable: true })
  lastEditedAt: Date | null;
}
