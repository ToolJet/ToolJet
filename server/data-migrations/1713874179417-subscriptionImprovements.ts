import { MigrationInterface, QueryRunner } from 'typeorm';

export class subscriptionImprovements1713874179417 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE organization_subscription_invoices DROP CONSTRAINT "FK_52458c44ef800b50cf4b8cc8d33"`
    );
    await queryRunner.query(
      `ALTER TABLE organization_subscription_invoices DROP CONSTRAINT "FK_f37a68fa18cf94bc0c54ee95502"`
    );
    await queryRunner.query(`ALTER TABLE organization_subscriptions DROP CONSTRAINT "FK_ee120ecc7d96135bd947a1ea7ae"`);
    await queryRunner.query(
      `ALTER TABLE "organization_subscription_invoices" ADD CONSTRAINT "FK_f37a68fa18cf94bc0c54ee95502" FOREIGN KEY ("organization_subscription_id") REFERENCES "organization_subscriptions"("id") ON DELETE CASCADE`
    );
    await queryRunner.query(
      `ALTER TABLE "organization_subscriptions" ADD CONSTRAINT "FK_ee120ecc7d96135bd947a1ea7ae" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE`
    );
    await queryRunner.query(`ALTER TABLE "organization_subscription_invoices" DROP COLUMN "organization_id"`);
    await queryRunner.query(`DROP TABLE "organizations_payments"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
