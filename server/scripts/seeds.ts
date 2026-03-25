import * as http from 'http';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

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

function getPort(): number {
  return parseInt(process.env.PORT || '3000', 10);
}

function makeRequest(port: number, path: string, method: string, payload?: string): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = {};
    if (payload) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = String(Buffer.byteLength(payload));
    }

    const req = http.request({ hostname: 'localhost', port, path, method, headers }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve({ statusCode: res.statusCode, body }));
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function waitForServer(port: number, timeoutMs = 60000): Promise<void> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.request({ hostname: 'localhost', port, path: '/api/health', method: 'GET' }, (res) => {
        if (res.statusCode === 200) return resolve();
        if (Date.now() - start > timeoutMs) return reject(new Error(`Server not healthy within ${timeoutMs}ms`));
        setTimeout(check, 1000);
      });
      req.on('error', () => {
        if (Date.now() - start > timeoutMs) return reject(new Error(`Server not reachable on port ${port} within ${timeoutMs}ms`));
        setTimeout(check, 1000);
      });
      req.end();
    };
    check();
  });
}

async function bootstrap() {
  const config = getSeedConfig();
  const port = getPort();

  // Wait for server to be available
  console.log(`Waiting for server on port ${port}...`);
  try {
    await waitForServer(port);
  } catch {
    console.error(`Server is not running on port ${port}.`);
    console.error('Start the server first: npm run start:dev');
    process.exit(1);
  }
  console.log('Server is ready.');

  // Hit the setup-super-admin endpoint (same as the curl QA uses)
  const payload = JSON.stringify({
    companyName: 'ToolJet',
    name: config.name,
    workspaceName: config.workspaceName,
    email: config.email,
    password: config.password,
  });

  console.log(`Seeding super admin: ${config.email}`);

  const response = await makeRequest(port, '/api/onboarding/setup-super-admin', 'POST', payload);

  if (response.statusCode === 201) {
    console.log('Super admin created successfully.');
    console.log(`  Email: ${config.email}`);
    console.log(`  Workspace: ${config.workspaceName}`);
    process.exit(0);
  } else if (response.statusCode === 403) {
    console.log('Database already has users — skipping seed.');
    console.log('To re-seed, run `npm run db:reset && npm run db:migrate` first.');
    process.exit(0);
  } else {
    console.error(`Seed failed with status ${response.statusCode}:`);
    try {
      const parsed = JSON.parse(response.body);
      console.error(parsed.message || response.body);
    } catch {
      console.error(response.body);
    }
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exit(1);
});
