/**
 * SslServerManagerService Unit Tests
 *
 * Covers the state machine (determineState), HTTPS server lifecycle, and
 * zero-downtime certificate reload.
 *
 * Uses jest.spyOn for both `fs` and `https` so that both the test module and
 * the service under test see the same modified module object — jest.mock() for
 * built-in Node modules can create a separate registry entry that the service
 * doesn't always pick up in ts-jest's CommonJS output.
 *
 * @group platform
 */
import * as fs from 'fs';
import * as https from 'https';
import { EventEmitter } from 'events';
import { Test, TestingModule } from '@nestjs/testing';
import { SslServerManagerService } from '@services/ssl-server-manager.service';
import { SslConfigurationService } from '@ee/ssl-configuration/service';
import { SslServerState } from '@ee/ssl-configuration/types/ssl-server-state.enum';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function buildConfig(overrides: Record<string, any> = {}) {
  return {
    enabled: false,
    domain: '',
    fullchainPem: '',
    privkeyPem: '',
    acquiredAt: '',
    domainChangeRequested: false,
    newDomain: '',
    ...overrides,
  };
}

/** Build a minimal fake https.Server that resolves listen() via its callback. */
function makeFakeServer() {
  const emitter = new EventEmitter();
  const setSecureContext = jest.fn();
  const close = jest.fn((cb?: () => void) => { if (cb) cb(); });
  const listen = jest.fn((_port: any, _addr: any, cb?: () => void) => {
    if (cb) setImmediate(cb); // async so Promise resolves normally
    return server;
  });
  const server: any = Object.assign(emitter, { listen, close, setSecureContext, listening: true });
  return server;
}

describe('SslServerManagerService', () => {
  let service: SslServerManagerService;
  let sslConfigService: jest.Mocked<SslConfigurationService>;

  // Spies reset per test
  let existsSyncSpy: jest.SpyInstance;
  let readFileSpy: jest.SpyInstance;
  let createServerSpy: jest.SpyInstance;
  let fakeServer: ReturnType<typeof makeFakeServer>;

  beforeEach(async () => {
    fakeServer = makeFakeServer();

    // Spy on the shared module objects — both test & service code reference these
    existsSyncSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    readFileSpy = jest.spyOn(fs.promises, 'readFile').mockResolvedValue(Buffer.from('pem'));
    createServerSpy = jest.spyOn(https, 'createServer').mockReturnValue(fakeServer);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SslServerManagerService,
        {
          provide: SslConfigurationService,
          useValue: { getConfig: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<SslServerManagerService>(SslServerManagerService);
    sslConfigService = module.get(SslConfigurationService);

    // Pre-wire fake Express app and ports
    (service as any).expressApp = {};
    (service as any).httpPort = 3000;
    (service as any).httpsPort = 3443;
    (service as any).listenAddr = '::';

    process.env.TOOLJET_HOST = 'https://app.example.com';
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.TOOLJET_HOST;
    (service as any).httpsServer = undefined;
    (service as any).currentState = SslServerState.HTTP_ONLY_DISABLED;
  });

  // -------------------------------------------------------------------------
  // determineState — state machine
  // -------------------------------------------------------------------------
  describe('determineState', () => {
    it('returns HTTP_ONLY_DISABLED when SSL is not enabled', () => {
      expect(service.determineState(buildConfig({ enabled: false }))).toBe(SslServerState.HTTP_ONLY_DISABLED);
    });

    it('returns HTTP_ONLY_PENDING when domain is missing', () => {
      expect(service.determineState(buildConfig({ enabled: true, domain: '' }))).toBe(SslServerState.HTTP_ONLY_PENDING);
    });

    it('returns HTTP_ONLY_PENDING when certificate files are absent from filesystem', () => {
      existsSyncSpy.mockReturnValue(false);
      expect(service.determineState(buildConfig({ enabled: true, domain: 'app.example.com' }))).toBe(SslServerState.HTTP_ONLY_PENDING);
    });

    it('returns HTTP_ONLY_PENDING when cert domain does not match TOOLJET_HOST', () => {
      existsSyncSpy.mockReturnValue(true);
      process.env.TOOLJET_HOST = 'https://other.example.com';
      expect(service.determineState(buildConfig({ enabled: true, domain: 'app.example.com' }))).toBe(SslServerState.HTTP_ONLY_PENDING);
    });

    it('returns HTTP_ONLY_PENDING when TOOLJET_HOST is not set', () => {
      existsSyncSpy.mockReturnValue(true);
      delete process.env.TOOLJET_HOST;
      expect(service.determineState(buildConfig({ enabled: true, domain: 'app.example.com' }))).toBe(SslServerState.HTTP_ONLY_PENDING);
    });

    it('returns HTTPS_ACTIVE when SSL is enabled, cert exists, and domain matches TOOLJET_HOST', () => {
      existsSyncSpy.mockReturnValue(true);
      expect(service.determineState(buildConfig({ enabled: true, domain: 'app.example.com' }))).toBe(SslServerState.HTTPS_ACTIVE);
    });

    it('returns HTTPS_ACTIVE when TOOLJET_HOST includes a non-standard port', () => {
      existsSyncSpy.mockReturnValue(true);
      // URL.hostname strips the port — 'https://app.example.com:3443' → 'app.example.com'
      process.env.TOOLJET_HOST = 'https://app.example.com:3443';
      expect(service.determineState(buildConfig({ enabled: true, domain: 'app.example.com' }))).toBe(SslServerState.HTTPS_ACTIVE);
    });
  });

  // -------------------------------------------------------------------------
  // startHttpsServer
  // -------------------------------------------------------------------------
  describe('startHttpsServer', () => {
    it('reads cert files and starts listening on the HTTPS port', async () => {
      sslConfigService.getConfig.mockResolvedValue(
        buildConfig({ enabled: true, domain: 'app.example.com' }) as any
      );

      await service.startHttpsServer();

      expect(readFileSpy).toHaveBeenCalledTimes(2);
      expect(createServerSpy).toHaveBeenCalled();
      expect(fakeServer.listen).toHaveBeenCalledWith(3443, '::', expect.any(Function));
      expect(service.isHttpsServerRunning()).toBe(true);
    });

    it('is idempotent — does not create a second server if already running', async () => {
      (service as any).httpsServer = fakeServer;

      await service.startHttpsServer();

      expect(createServerSpy).not.toHaveBeenCalled();
    });

    it('throws when Express app is not initialized', async () => {
      (service as any).expressApp = undefined;
      await expect(service.startHttpsServer()).rejects.toThrow('Express app not initialized');
    });

    it('falls back to domain extracted from TOOLJET_HOST when config domain is empty', async () => {
      sslConfigService.getConfig.mockResolvedValue(buildConfig({ enabled: true, domain: '' }) as any);
      process.env.TOOLJET_HOST = 'https://app.example.com';

      await service.startHttpsServer();

      // Should have read from the path derived from TOOLJET_HOST hostname
      expect(readFileSpy).toHaveBeenCalledWith(expect.stringContaining('app.example.com'));
    });
  });

  // -------------------------------------------------------------------------
  // reloadCertificates — zero-downtime swap via setSecureContext
  // -------------------------------------------------------------------------
  describe('reloadCertificates', () => {
    beforeEach(() => {
      (service as any).httpsServer = fakeServer;
      (service as any).currentState = SslServerState.HTTPS_ACTIVE;
    });

    it('calls setSecureContext in-place instead of closing and recreating the server', async () => {
      sslConfigService.getConfig.mockResolvedValue(
        buildConfig({ enabled: true, domain: 'app.example.com' }) as any
      );

      await service.reloadCertificates();

      expect(fakeServer.setSecureContext).toHaveBeenCalledWith({
        key: expect.any(Buffer),
        cert: expect.any(Buffer),
      });
      expect(fakeServer.close).not.toHaveBeenCalled();
    });

    it('starts a new HTTPS server when reloadCertificates is called without an existing server', async () => {
      (service as any).httpsServer = undefined;
      sslConfigService.getConfig.mockResolvedValue(
        buildConfig({ enabled: true, domain: 'app.example.com' }) as any
      );

      await service.reloadCertificates();

      expect(createServerSpy).toHaveBeenCalled();
    });

    it('throws when HTTPS is not in HTTPS_ACTIVE state', async () => {
      (service as any).currentState = SslServerState.HTTP_ONLY_PENDING;
      await expect(service.reloadCertificates()).rejects.toThrow('Cannot reload certificates');
    });
  });

  // -------------------------------------------------------------------------
  // transitionTo
  // -------------------------------------------------------------------------
  describe('transitionTo', () => {
    it('is a no-op when already in the target state', async () => {
      (service as any).currentState = SslServerState.HTTP_ONLY_DISABLED;
      await service.transitionTo(SslServerState.HTTP_ONLY_DISABLED);
      expect(createServerSpy).not.toHaveBeenCalled();
    });

    it('stops HTTPS server when transitioning away from HTTPS_ACTIVE', async () => {
      (service as any).currentState = SslServerState.HTTPS_ACTIVE;
      (service as any).httpsServer = fakeServer;

      await service.transitionTo(SslServerState.HTTP_ONLY_PENDING);

      expect(fakeServer.close).toHaveBeenCalled();
      expect(service.getState()).toBe(SslServerState.HTTP_ONLY_PENDING);
    });
  });

  // -------------------------------------------------------------------------
  // State getters
  // -------------------------------------------------------------------------
  describe('state getters', () => {
    it('isHttpServerRunning always returns true (HTTP server is managed by NestJS)', () => {
      expect(service.isHttpServerRunning()).toBe(true);
    });

    it('isHttpsServerRunning returns false when server has not started', () => {
      expect(service.isHttpsServerRunning()).toBe(false);
    });

    it('getHttpPort and getHttpsPort reflect values passed to initialize()', async () => {
      await service.initialize({} as any, 3000, 3443, '::');
      expect(service.getHttpPort()).toBe(3000);
      expect(service.getHttpsPort()).toBe(3443);
    });
  });
});
