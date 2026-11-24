import { Agent, createServer, IncomingMessage, ServerResponse } from 'http';
import { AddressInfo } from 'net';
import OpenRouter from '../lib';
import { Operation, SourceOptions } from '../lib/types';

const plugin = new OpenRouter();
const apiKey = 'example-bearer';
const headers = JSON.stringify([
  ['X-Workshop-Key', 'example-gateway-key'],
  ['X-Region', 'west'],
  ['', ''],
]);

async function withEndpoint(
  handle: (req: IncomingMessage, res: ServerResponse) => void,
  check: (url: string) => Promise<void>
) {
  const server = createServer(handle);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    await check(`http://127.0.0.1:${(server.address() as AddressInfo).port}/v1`);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

const operations = [Operation.Chat, Operation.GenerateEmbedding, Operation.ListModels];
test.each([
  [
    'legacy',
    { apiKey, siteUrl: 'https://workshop.example', appName: 'Workshop' },
    { authorization: 'Bearer ' + apiKey },
  ],
  ['cleared', { apiKey, customHeaders: '[]' }, { authorization: 'Bearer ' + apiKey }],
  ['header only', { customHeaders: headers }, { 'x-workshop-key': 'example-gateway-key', 'x-region': 'west' }],
  ['combined', { apiKey, customHeaders: headers }, { authorization: 'Bearer ' + apiKey, 'x-region': 'west' }],
] as const)('uses %s credentials for Test connection and every query', async (mode, options, expected) => {
  const requests: IncomingMessage[] = [];
  await withEndpoint(
    (req, res) => {
      requests.push(req);
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ data: [{ id: 'example-model' }], choices: [{ message: { content: 'ok' } }] }));
    },
    async (baseUrl) => {
      const source: SourceOptions = { ...options, baseUrl };
      await expect(plugin.testConnection(source)).resolves.toEqual({ status: 'ok' });
      for (const operation of operations) {
        await expect(
          plugin.run(source, { operation, model: 'example-model', prompt: 'Hello', encoding_format: 'float' }, 'test')
        ).resolves.toHaveProperty('status', 'ok');
      }
    }
  );
  expect(requests.map((r) => r.url)).toEqual(['/v1/models', '/v1/chat/completions', '/v1/embeddings', '/v1/models']);
  for (const req of requests) {
    expect(req.headers).toMatchObject(expected);
    if (mode === 'header only') expect(req.headers.authorization).toBeUndefined();
    if (mode === 'legacy') {
      expect(req.headers).toMatchObject({ 'http-referer': 'https://workshop.example', 'x-title': 'Workshop' });
      expect(req.headers['x-workshop-key']).toBeUndefined();
    }
  }
});

test('a gateway can reject a connection test and a query with the wrong custom credential', async () => {
  await withEndpoint(
    (req, res) => {
      res.setHeader('content-type', 'application/json');
      if (req.headers['x-workshop-key'] === 'correct-key')
        return res.end(JSON.stringify({ data: [{ id: 'example' }] }));
      res
        .writeHead(401, { 'content-type': 'application/json' })
        .end(JSON.stringify({ error: { message: 'Unauthorized' } }));
    },
    async (baseUrl) => {
      await expect(
        plugin.testConnection({ baseUrl, customHeaders: JSON.stringify([['X-Workshop-Key', 'correct-key']]) })
      ).resolves.toEqual({ status: 'ok' });
      const source = { baseUrl, customHeaders: headers };
      await expect(plugin.testConnection(source)).rejects.toMatchObject({
        description: expect.stringContaining('401'),
      });
      await expect(plugin.run(source, { operation: Operation.Chat }, 'test')).rejects.toMatchObject({
        description: expect.stringContaining('401'),
      });
    }
  );
});

test('custom credentials are never forwarded to a redirect destination', async () => {
  const destination = jest.fn((_req: IncomingMessage, res: ServerResponse) => res.end('{}'));
  await withEndpoint(destination, async (target) => {
    await withEndpoint(
      (_req, res) => res.writeHead(302, { location: target }).end(),
      async (baseUrl) => {
        await expect(plugin.testConnection({ baseUrl, customHeaders: headers })).rejects.toThrow();
      }
    );
  });
  expect(destination).not.toHaveBeenCalled();
});

test.each(['broken-json', '[123]', '[["", "value"]]', '[["Bad Name", "value"]]', '[["X-Test","bad\\r\\nvalue"]]'])(
  'rejects invalid custom headers without printing their contents',
  async (customHeaders) => {
    await expect(plugin.getConnection({ apiKey, customHeaders })).rejects.toMatchObject({
      description: expect.stringMatching(
        /^(Enter headers as name and value pairs\.|Check the header name and value in row 1\.)$/
      ),
    });
  }
);

test('uses the configured Node HTTP agent for requests with custom headers', async () => {
  const agent = new Agent();
  const connect = jest.spyOn(agent, 'createConnection');
  try {
    await withEndpoint(
      (_req, res) => res.writeHead(200, { 'content-type': 'application/json' }).end('{"data":[]}'),
      async (baseUrl) => {
        const client = await plugin.getConnection({ baseUrl, customHeaders: headers });
        client.httpAgent = agent;
        await client.models.list();
        expect(connect).toHaveBeenCalled();
      }
    );
  } finally {
    agent.destroy();
  }
});
