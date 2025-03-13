import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum AIOperation {
  Component = 'component',
  Query = 'query',
  Events = 'events',
  BusinessLogic = 'business_logic',
  Agentic = 'agentic',
  TableGeneration = 'table_generation',
  ColorTheme = 'color_theme',
  ModifyLayout = 'modify_layout',
  Docs = 'docs',
  EntireAppGeneration = 'entire_app_generation',
}

@Entity('ai_chat_prompts')
export class AIChatPrompt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'prompt', type: 'json' })
  prompt: Record<string, any>;

  @Column({ name: 'response', type: 'json', nullable: true })
  response: Record<string, any>;

  @Column({ name: 'provider', type: 'enum', enum: ['openai', 'claude', 'docs', 'copilot'] })
  provider: 'openai' | 'claude' | 'docs' | 'copilot';

  @Column({ name: 'operation_id', type: 'varchar' })
  operationId: AIOperation;

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId: string;

  @Column({ name: 'selfhost_customer_id', type: 'uuid', nullable: true })
  selfhostCustomerId: string;

  @Column({ name: 'credits_used', type: 'int', default: 0 })
  creditsUsed: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
