import { MigrationInterface, QueryRunner } from 'typeorm';

// Review requests on app versions: a version is proposed for release,
// reviewers comment, approve or request changes, and the release is gated on
// an approval of the exact content being released.
export class CreateAppVersionReviews1791700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS app_version_reviews (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL,
        app_id uuid NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
        version_id uuid NOT NULL REFERENCES app_versions(id) ON DELETE CASCADE,
        base_version_id uuid NULL REFERENCES app_versions(id) ON DELETE SET NULL,
        author_id uuid NOT NULL REFERENCES users(id),
        title varchar(200) NOT NULL,
        description text NULL,
        status varchar(20) NOT NULL DEFAULT 'open',
        required_approvals integer NOT NULL DEFAULT 1,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )`);
    // One live review per version.
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS app_version_reviews_one_open ON app_version_reviews (version_id) WHERE status = 'open'`
    );
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS app_version_reviews_app ON app_version_reviews (app_id, status)`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS app_version_review_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        review_id uuid NOT NULL REFERENCES app_version_reviews(id) ON DELETE CASCADE,
        actor_id uuid NOT NULL REFERENCES users(id),
        kind varchar(30) NOT NULL,
        body text NULL,
        anchor varchar(300) NULL,
        fingerprint varchar(80) NULL,
        created_at timestamp NOT NULL DEFAULT now()
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS app_version_review_events_review ON app_version_review_events (review_id, created_at)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS app_version_review_events');
    await queryRunner.query('DROP TABLE IF EXISTS app_version_reviews');
  }
}
