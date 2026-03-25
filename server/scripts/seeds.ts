import * as path from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import got from 'got';

// Load .env the same way other scripts do
const nodeEnvPath = path.resolve(process.cwd(), process.env.NODE_ENV === 'test' ? '../.env.test' : '../.env');
const fallbackPath = path.resolve(process.cwd(), '../.env');
if (fs.existsSync(nodeEnvPath)) {
  dotenv.config({ path: nodeEnvPath });
} else if (fs.existsSync(fallbackPath)) {
  dotenv.config({ path: fallbackPath });
}

const SEED_DEFAULTS = {
  email: 'dev@tooljet.com',
  password: 'password',
  name: 'The Developer',
  workspaceName: 'My workspace',
};

function getSeedConfig() {
  return {
    email: process.env.SEED_EMAIL || SEED_DEFAULTS.email,
    password: process.env.SEED_PASSWORD || SEED_DEFAULTS.password,
    name: process.env.SEED_NAME || SEED_DEFAULTS.name,
    workspaceName: process.env.SEED_WORKSPACE || SEED_DEFAULTS.workspaceName,
  };
}

function getBaseUrl(): string {
  const port = process.env.PORT || '3000';
  return `http://localhost:${port}`;
}

async function waitForServer(baseUrl: string, timeoutMs = 60000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await got.get(`${baseUrl}/api/health`, { timeout: { request: 2000 } });
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error(`Server not reachable at ${baseUrl} within ${timeoutMs}ms`);
}

async function bootstrap() {
  const config = getSeedConfig();
  const baseUrl = getBaseUrl();

  try {
    await waitForServer(baseUrl);
  } catch {
    console.error(`Server is not running at ${baseUrl}. Start the server first: npm run start:dev`);
    process.exit(1);
  }

  try {
    await got.post(`${baseUrl}/api/onboarding/setup-super-admin`, {
      json: {
        companyName: 'ToolJet',
        name: config.name,
        workspaceName: config.workspaceName,
        email: config.email,
        password: config.password,
      },
    });

    console.log(`👤 Super admin created successfully. Email: ${config.email}`);
    process.exit(0);
  } catch (error) {
    if (error.response?.statusCode === 403) {
      console.error('⚠️  Database already has users. To re-seed, run `npm run db:reset` first — all data will be lost.');
      process.exit(0);
    }

    const message = error.response?.body
      ? (() => {
          try {
            return JSON.parse(error.response.body).message;
          } catch {
            return error.response.body;
          }
        })()
      : error.message;

    console.error(`Seed failed: ${message}`);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exit(1);
});
