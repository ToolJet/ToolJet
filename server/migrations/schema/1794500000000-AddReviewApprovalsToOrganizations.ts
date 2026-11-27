import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/** Approvals a version needs before it is saved, released or promoted to production. 0 turns reviews off. */
export class AddReviewApprovalsToOrganizations1794500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'organizations',
      new TableColumn({
        name: 'review_approvals',
        type: 'integer',
        isNullable: false,
        default: 0,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('organizations', 'review_approvals');
  }
}
