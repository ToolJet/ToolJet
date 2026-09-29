import { MigrationInterface, QueryRunner } from 'typeorm';

/** Forward-only compatibility for environments that already applied the attachment metadata migration. */
export class HardenAiAttachmentLifecycle1790683200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE ai_attachments
        ADD COLUMN storage_organization_id uuid,
        ADD COLUMN storage_user_id uuid,
        ADD COLUMN next_cleanup_at timestamptz NOT NULL DEFAULT now(),
        ADD COLUMN cleanup_attempts integer NOT NULL DEFAULT 0;
      UPDATE ai_attachments SET storage_organization_id = organization_id, storage_user_id = user_id;
      ALTER TABLE ai_attachments DROP CONSTRAINT IF EXISTS ai_attachments_state_check;
      ALTER TABLE ai_attachments ADD CONSTRAINT ai_attachments_state_check
        CHECK (state IN ('uploading', 'draft', 'attached', 'deleting'));
      CREATE INDEX idx_ai_attachments_cleanup ON ai_attachments (next_cleanup_at);
      CREATE TABLE ai_attachment_references (
        attachment_id uuid NOT NULL REFERENCES ai_attachments(id) ON DELETE CASCADE,
        conversation_id uuid NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
        PRIMARY KEY (attachment_id, conversation_id)
      );
      CREATE INDEX idx_ai_attachment_references_conversation ON ai_attachment_references(conversation_id);
      INSERT INTO ai_attachment_references (attachment_id, conversation_id)
        SELECT id, conversation_id FROM ai_attachments WHERE conversation_id IS NOT NULL
        ON CONFLICT DO NOTHING;
      INSERT INTO ai_attachment_references (attachment_id, conversation_id)
        SELECT a.id, c.id FROM ai_conversations c
        JOIN apps app ON app.id = c.app_id
        CROSS JOIN LATERAL jsonb_array_elements_text(CASE
          WHEN jsonb_typeof(c.metadata::jsonb->'attachmentIds') = 'array' THEN c.metadata::jsonb->'attachmentIds'
          ELSE '[]'::jsonb END) ids(value)
        JOIN ai_attachments a ON a.id::text = ids.value AND a.user_id = c.user_id AND a.organization_id = app.organization_id
        ON CONFLICT DO NOTHING;
      CREATE TABLE ai_attachment_admissions (
        id uuid PRIMARY KEY,
        owner varchar(160) NOT NULL,
        user_id uuid,
        purpose varchar(16) NOT NULL CHECK (purpose IN ('original', 'provider')),
        created_at timestamptz NOT NULL DEFAULT now(),
        expires_at timestamptz NOT NULL
      );
      CREATE INDEX idx_ai_attachment_admissions_owner ON ai_attachment_admissions(owner, purpose, expires_at);
      CREATE INDEX idx_ai_attachment_admissions_user ON ai_attachment_admissions(user_id, purpose, expires_at)
        WHERE user_id IS NOT NULL;
      CREATE INDEX idx_ai_attachment_admissions_expiry ON ai_attachment_admissions(expires_at);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Refuse to silently destroy shared ownership or in-flight upload receipts during rollback.
    const [pending] = await queryRunner.query(`SELECT EXISTS (
      SELECT 1 FROM ai_attachments WHERE state IN ('uploading', 'deleting')
      UNION ALL SELECT 1 FROM ai_attachment_references GROUP BY attachment_id HAVING COUNT(*) > 1
    ) AS present`);
    if (pending.present) throw new Error('Drain attachment uploads/cleanup and shared references before rollback.');
    await queryRunner.query(`
      UPDATE ai_attachments a SET conversation_id = r.conversation_id
        FROM ai_attachment_references r WHERE r.attachment_id = a.id;
      DROP TABLE ai_attachment_admissions;
      DROP TABLE ai_attachment_references;
      DROP INDEX idx_ai_attachments_cleanup;
      DROP INDEX IF EXISTS idx_ai_attachments_reconcile;
      ALTER TABLE ai_attachments DROP CONSTRAINT ai_attachments_state_check;
      ALTER TABLE ai_attachments ADD CONSTRAINT ai_attachments_state_check CHECK (state IN ('draft', 'attached'));
      ALTER TABLE ai_attachments DROP COLUMN storage_organization_id, DROP COLUMN storage_user_id,
        DROP COLUMN next_cleanup_at, DROP COLUMN cleanup_attempts;
    `);
  }
}
