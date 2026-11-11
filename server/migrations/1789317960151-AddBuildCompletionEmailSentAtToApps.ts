import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddBuildCompletionEmailSentAtToApps1789317960151 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Records that the "your app is ready" email has gone out for this app, and is the lock that
    // makes sure it only ever goes out once. A create-build that fails and is retried classifies
    // as `create` again — the app is still blank — so "first generation" has to be a fact about
    // the app, not something the request handler can remember.
    //
    // A nullable timestamp rather than a boolean: it costs nothing extra and answers "when were
    // they told?" for support, which a flag cannot.
    await queryRunner.addColumn(
      'apps',
      new TableColumn({
        name: 'build_completion_email_sent_at',
        type: 'timestamp',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('apps', 'build_completion_email_sent_at');
  }
}
