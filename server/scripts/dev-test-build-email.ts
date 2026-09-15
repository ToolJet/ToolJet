/**
 * Dev-only harness for the "your app is ready" build-completion email.
 *
 * Fires the REAL trigger — the same private method sendUserMessage calls when an agent turn
 * finishes — against a real app row, so it exercises the eligibility gate, the DB re-read, the
 * atomic claim, the payload, the emailEvent listener, the template and delivery. The only thing
 * it stands in for is the agent reporting `intent: 'create'`.
 *
 * Usage (from server/):
 *   npx ts-node -r tsconfig-paths/register --transpile-only scripts/dev-test-build-email.ts
 *   ... --app <appId>          target a specific app (default: most recently created)
 *   ... --name "Sales Tracker" pretend the agent named the app this
 *   ... --reset                clear the claim first, so the same app can be re-tested
 *   ... --intent modify        try a non-create intent and watch it stay silent
 *   ... --failed               try a failed build and watch it stay silent
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@modules/app/module';
import { EntityManager } from 'typeorm';
import { getEnvVars } from './database-config-utils';

const ENV_VARS = getEnvVars();
Object.keys(ENV_VARS).forEach((key) => {
  if (process.env[key] === undefined) process.env[key] = ENV_VARS[key];
});

const arg = (flag: string, fallback?: string) => {
  const i = process.argv.indexOf(flag);
  return i === -1 ? fallback : process.argv[i + 1];
};
const has = (flag: string) => process.argv.includes(flag);

(async () => {
  const context = await NestFactory.createApplicationContext(await AppModule.register({ IS_GET_CONTEXT: true }), { logger: false });
  const manager = context.get(EntityManager, { strict: false });

  const appId = arg('--app');
  const app = (
    await manager.query(
      appId
        ? `SELECT a.id, a.name, a.slug, a.type, a.build_completion_email_sent_at, a.user_id
             FROM apps a WHERE a.id = $1`
        : `SELECT a.id, a.name, a.slug, a.type, a.build_completion_email_sent_at, a.user_id
             FROM apps a ORDER BY a.created_at DESC LIMIT 1`,
      appId ? [appId] : []
    )
  )[0];

  if (!app) {
    console.error('No app found. Create one in the UI, or pass --app <id>.');
    await context.close();
    process.exit(1);
  }

  const user = (await manager.query(`SELECT * FROM users WHERE id = $1`, [app.user_id]))[0];

  if (has('--reset')) {
    await manager.query(`UPDATE apps SET build_completion_email_sent_at = NULL WHERE id = $1`, [app.id]);
    app.build_completion_email_sent_at = null;
    console.log('· claim cleared\n');
  }

  console.log('app       :', app.name, `(${app.id})`);
  console.log('recipient :', user.email);
  console.log('claimed   :', app.build_completion_email_sent_at ?? 'not yet');
  console.log('\n--- firing trigger ---\n');

  // The EE service is what the AI module actually instantiates; resolve it by the same class.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { AiService } = require('@ee/ai/service');
  const aiService = context.get(AiService, { strict: false });

  await aiService['maybeSendBuildCompletionEmail']({
    user: { ...user, firstName: user.first_name },
    conversation: { appId: app.id, app: { type: app.type } },
    generatedAppName: arg('--name', null),
    failed: has('--failed'),
    intent: arg('--intent', 'create'),
  });

  // The listener runs detached from the emit, so give it a moment to render and deliver.
  await new Promise((r) => setTimeout(r, 3000));

  const after = (await manager.query(`SELECT build_completion_email_sent_at FROM apps WHERE id = $1`, [app.id]))[0];
  console.log('\n--- result ---');
  console.log('claim after:', after.build_completion_email_sent_at ?? 'still unclaimed (no email sent)');

  await context.close();
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
