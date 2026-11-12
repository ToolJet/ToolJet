// migration-lint: allow-destructive drops two foreign keys of app_version_reviews, a table of this unreleased feature; no data is touched
import { MigrationInterface, QueryRunner } from 'typeorm';

// A review is kept, and marked invalid, when a version it points at is deleted. The foreign keys got there first:
// ON DELETE CASCADE on version_id dropped the review, and ON DELETE SET NULL on base_version_id cleared the base,
// which then read as "compare with an empty app". Without them the review keeps both ids, and a version that is no
// longer among the app's versions is how a review knows it was deleted.
export class DropAppVersionReviewVersionForeignKeys1793500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE app_version_reviews DROP CONSTRAINT IF EXISTS app_version_reviews_version_id_fkey`
    );
    await queryRunner.query(
      `ALTER TABLE app_version_reviews DROP CONSTRAINT IF EXISTS app_version_reviews_base_version_id_fkey`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // NOT VALID: reviews kept past a deleted version now point at nothing, and would stop the constraints from being added.
    await queryRunner.query(
      `ALTER TABLE app_version_reviews ADD CONSTRAINT app_version_reviews_version_id_fkey FOREIGN KEY (version_id) REFERENCES app_versions(id) ON DELETE CASCADE NOT VALID`
    );
    await queryRunner.query(
      `ALTER TABLE app_version_reviews ADD CONSTRAINT app_version_reviews_base_version_id_fkey FOREIGN KEY (base_version_id) REFERENCES app_versions(id) ON DELETE SET NULL NOT VALID`
    );
  }
}
