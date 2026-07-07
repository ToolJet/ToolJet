import { DataSource } from 'typeorm';
import { ormconfig } from '../ormconfig';
import { User } from '../src/entities/user.entity';
import { getEnvVars } from './database-config-utils';
import * as uuid from 'uuid';

getEnvVars();

const args = process.argv.slice(2);
const emailIdx = args.indexOf('--email');
const email = emailIdx !== -1 ? args[emailIdx + 1] : null;

if (!email) {
  console.error('Usage: npm run reset-superadmin -- --email admin@company.com');
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

  const forgotPasswordToken = uuid.v4();
  await manager.update(User, user.id, { forgotPasswordToken });

  const tooljetHost = (process.env.TOOLJET_HOST || 'http://localhost:3000').replace(/\/$/, '');

  console.log(`✓ Super admin found: ${user.firstName} ${user.lastName} (${user.email})`);
  console.log('✓ Reset token generated.');
  console.log('');
  console.log('Share this link with the user:');
  console.log(`${tooljetHost}/reset-password/${forgotPasswordToken}`);

  await dataSource.destroy();
  process.exit(0);
}

bootstrap().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
