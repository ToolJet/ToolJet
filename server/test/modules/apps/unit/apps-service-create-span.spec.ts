/** @group platform */
jest.mock('@helpers/database.helper', () => ({
  dbTransactionWrap: (fn: (manager: unknown) => unknown) => fn({}),
}));

import { context, propagation, trace } from '@opentelemetry/api';
import { RPCType, setRPCMetadata } from '@opentelemetry/core';
import { InMemorySpanExporter, NodeTracerProvider, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { AppsService } from '@modules/apps/service';
import { APP_TYPES } from '@modules/apps/constants';
import { AppCreateDto } from '@modules/apps/dto';
import { User } from '@entities/user.entity';
import { setRequestSpanAttributes } from '@otel/request-span';

// fresh exporter per test: provider.shutdown() stops the exporter for good
let exporter: InMemorySpanExporter;
let provider: NodeTracerProvider | undefined;

const registerOtel = () => {
  exporter = new InMemorySpanExporter();
  provider = new NodeTracerProvider({ spanProcessors: [new SimpleSpanProcessor(exporter)] });
  provider.register();
};

const unregisterOtel = async () => {
  await provider?.shutdown();
  provider = undefined;
  trace.disable();
  context.disable();
  propagation.disable();
};

// Stand-in for http instrumentation: SERVER span in RPC metadata, Nest handler span active under it.
async function inRequest(fn: () => unknown) {
  const tracer = trace.getTracer('test');
  const server = tracer.startSpan('POST /api/apps');
  const serverContext = setRPCMetadata(trace.setSpan(context.active(), server), { type: RPCType.HTTP, span: server });
  const handler = tracer.startSpan('AppsController.create', undefined, serverContext);
  await context.with(trace.setSpan(serverContext, handler), fn);
  handler.end();
  server.end();
  const spans = exporter.getFinishedSpans();
  return {
    server: spans.find((span) => span.name === 'POST /api/apps'),
    handler: spans.find((span) => span.name === 'AppsController.create'),
  };
}

describe('setRequestSpanAttributes', () => {
  describe('without an OTel SDK', () => {
    it('is a no-op', () => {
      expect(() => setRequestSpanAttributes({ 'tooljet.app.id': 'app-1' })).not.toThrow();
    });
  });

  describe('with an OTel SDK', () => {
    beforeEach(registerOtel);
    afterEach(unregisterOtel);

    it('stamps the HTTP server span, not the active handler span', async () => {
      const { server, handler } = await inRequest(() => setRequestSpanAttributes({ 'tooljet.app.id': 'app-1' }));
      expect(server?.attributes['tooljet.app.id']).toBe('app-1');
      expect(handler?.attributes).not.toHaveProperty('tooljet.app.id');
    });

    it('falls back to the active span outside an HTTP request', () => {
      const job = trace.getTracer('test').startSpan('job');
      context.with(trace.setSpan(context.active(), job), () => setRequestSpanAttributes({ 'tooljet.app.id': 'app-1' }));
      job.end();
      expect(exporter.getFinishedSpans()[0].attributes['tooljet.app.id']).toBe('app-1');
    });
  });
});

describe('AppsService.create', () => {
  beforeEach(registerOtel);
  afterEach(unregisterOtel);

  it('stamps the created app and its workspace on the request span', async () => {
    const service = Object.assign(Object.create(AppsService.prototype) as AppsService, {
      gitSyncConfigsUtilService: {
        isGitEditLocked: jest.fn().mockResolvedValue(false),
        getDetails: jest.fn().mockResolvedValue({ options: {} }),
      },
      appsUtilService: { create: jest.fn().mockResolvedValue({ id: 'app-1', slug: 'inventory' }) },
    });
    const user = { id: 'builder-a', organizationId: 'workspace-a' } as User;
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const { server } = await inRequest(() =>
      service.create(user, { name: 'Inventory', type: APP_TYPES.WORKFLOW } as AppCreateDto)
    );

    error.mockRestore();
    expect(server?.attributes).toMatchObject({
      'tooljet.app.id': 'app-1',
      'tooljet.organization.id': 'workspace-a',
    });
  });
});
