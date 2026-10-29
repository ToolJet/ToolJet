import { DataSource } from 'typeorm';
import { ormconfig } from '../ormconfig';
import { User } from '../src/entities/user.entity';
import { UserMfa } from '../src/entities/user_mfa.entity';
import { getEnvVars } from './database-config-utils';

getEnvVars();

const args = process.argv.slice(2);
const emailIdx = args.indexOf('--email');
const email = emailIdx !== -1 ? args[emailIdx + 1] : null;

if (!email) {
  console.error('Usage: npm run reset-mfa -- --email admin@company.com');
  process.exit(1);
}

async function bootstrap() {
  const dataSource = new DataSource({
    ...(ormconfig as any),
    entities: [__dirname + '/../src/**/*.entity{.js,.ts}', __dirname + '/../ee/**/*.entity{.js,.ts}'],
  });

  await dataSource.initialize();
  const manager = dataSource.manager;

  const user = await manager.findOne(User, { where: { email } });

  if (!user) {
    console.error(`✗ No user found with email: ${email}`);
    await dataSource.destroy();
    process.exit(1);
  }

  if (user.userType !== 'instance') {
    console.error(`✗ User ${email} is not a super admin (user_type must be 'instance')`);
    await dataSource.destroy();
    process.exit(1);
  }

  await manager.transaction(async (txManager) => {
    await txManager.update(User, user.id, { mfaEnabled: false, mfaSetupCompletedAt: null });
    await txManager.delete(UserMfa, { identifier: email });
  });

  console.log(`✓ Super admin found: ${user.firstName} ${user.lastName} (${user.email})`);
  console.log('✓ MFA settings cleared.');
  console.log('');
  console.log('The user can now log in without MFA.');

  await dataSource.destroy();
  process.exit(0);
}

bootstrap().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
