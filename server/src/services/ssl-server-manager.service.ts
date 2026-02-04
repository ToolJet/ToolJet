import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import { SslConfigurationService } from '@ee/ssl-configuration/service';
import { SslServerState } from '@ee/ssl-configuration/types/ssl-server-state.enum';

interface SslCertificatePaths {
  privkeyPath: string;
  fullchainPath: string;
}

/**
 * Service responsible for managing HTTP and HTTPS server lifecycle
 * Handles dual server setup, certificate reloads, and state transitions
 */
@Injectable()
export class SslServerManagerService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(SslServerManagerService.name);
  private httpServer?: http.Server;
  private httpsServer?: https.Server;
  private currentState: SslServerState = SslServerState.HTTP_ONLY_DISABLED;
  private httpPort = 3000;
  private httpsPort = 3443;
  private listenAddr = '::';
  private readonly CERT_BASE_PATH = '/etc/letsencrypt/live';
  private isInitialized = false;

  constructor(private readonly sslConfigService: SslConfigurationService) {}

  /**
   * OnApplicationBootstrap: Runs after NestJS is fully initialized
   * Non-blocking: uses setImmediate() to avoid blocking app startup
   */
  async onApplicationBootstrap(): Promise<void> {
    // Only initialize if native HTTPS is enabled
    if (process.env.ENABLE_NATIVE_HTTPS !== 'true') {
      this.logger.log('Native HTTPS disabled - skipping SSL server manager initialization');
      return;
    }

    // Non-blocking initialization using setImmediate (same pattern as SslBootstrapService)
    setImmediate(() => {
      this.initializeAsync().catch((error) => {
        this.logger.error('Failed to initialize SSL server manager:', error.message);
        this.logger.error('App will continue with HTTP only');
      });
    });
  }

  /**
   * Async initialization logic
   * Determines SSL state and conditionally starts HTTPS server
   */
  private async initializeAsync(): Promise<void> {
    try {
      this.logger.log('SSL Server Manager initializing...');

      // Get SSL configuration from database
      const sslConfig = await this.sslConfigService.getConfig();

      // Determine current state
      const state = this.determineState(sslConfig);
      this.logger.log(`SSL state: ${state}`);

      // Transition to appropriate state
      await this.transitionTo(state);

      this.isInitialized = true;
      this.logger.log('SSL Server Manager initialized successfully');
    } catch (error) {
      this.logger.error('Error during SSL server initialization:', error.message);
      throw error;
    }
  }

  /**
   * Initialize HTTP and optionally HTTPS servers
   * Called from main.ts with Express instance and port configuration
   */
  async initialize(
    expressApp: any,
    httpPort: number,
    httpsPort: number,
    listenAddr: string = '::'
  ): Promise<void> {
    this.httpPort = httpPort;
    this.httpsPort = httpsPort;
    this.listenAddr = listenAddr;

    this.logger.log(`Initializing servers - HTTP: ${httpPort}, HTTPS: ${httpsPort}`);

    // Create HTTP server (always running)
    this.httpServer = http.createServer(expressApp);

    await new Promise<void>((resolve, reject) => {
      this.httpServer!.listen(httpPort, listenAddr, () => {
        this.logger.log(`✅ HTTP server listening on ${listenAddr}:${httpPort}`);
        resolve();
      });

      this.httpServer!.on('error', (error) => {
        this.logger.error(`HTTP server error: ${error.message}`);
        reject(error);
      });
    });

    // Store Express app for HTTPS server creation
    (this as any).expressApp = expressApp;
  }

  /**
   * Determine SSL state from configuration
   */
  determineState(sslConfig: any): SslServerState {
    if (!sslConfig.enabled) {
      return SslServerState.HTTP_ONLY_DISABLED;
    }

    // SSL enabled - check if certificate exists
    const domain = sslConfig.domain || this.extractDomainFromTooljetHost();
    if (!domain) {
      this.logger.warn('No domain configured - SSL enabled but certificate pending');
      return SslServerState.HTTP_ONLY_PENDING;
    }

    const certificateExists = this.checkCertificateExists(domain);
    if (!certificateExists) {
      this.logger.log(`Certificate not yet acquired for ${domain}`);
      return SslServerState.HTTP_ONLY_PENDING;
    }

    return SslServerState.HTTPS_ACTIVE;
  }

  /**
   * Transition to new SSL state
   */
  async transitionTo(newState: SslServerState): Promise<void> {
    if (this.currentState === newState) {
      this.logger.debug(`Already in state ${newState}`);
      return;
    }

    this.logger.log(`Transitioning from ${this.currentState} to ${newState}`);

    const fromActive = this.currentState === SslServerState.HTTPS_ACTIVE;
    const toActive = newState === SslServerState.HTTPS_ACTIVE;

    if (fromActive && !toActive) {
      // Transition away from HTTPS_ACTIVE - stop HTTPS server
      await this.stopHttpsServer();
    } else if (!fromActive && toActive) {
      // Transition to HTTPS_ACTIVE - start HTTPS server
      await this.startHttpsServer();
    }

    this.currentState = newState;
    this.logger.log(`State transition complete: ${newState}`);
  }

  /**
   * Start HTTPS server with current certificates
   */
  async startHttpsServer(): Promise<void> {
    if (this.httpsServer) {
      this.logger.warn('HTTPS server already running');
      return;
    }

    if (!(this as any).expressApp) {
      throw new Error('Express app not initialized - call initialize() first');
    }

    const sslConfig = await this.sslConfigService.getConfig();
    const domain = sslConfig.domain || this.extractDomainFromTooljetHost();

    if (!domain) {
      throw new Error('No domain configured - cannot start HTTPS server');
    }

    const certPaths = this.getCertificatePaths(domain);

    this.logger.log(`Starting HTTPS server with certificates from ${certPaths.fullchainPath}`);

    // Read certificates
    const httpsOptions = {
      key: fs.readFileSync(certPaths.privkeyPath),
      cert: fs.readFileSync(certPaths.fullchainPath),
    };

    // Create HTTPS server with same Express app
    this.httpsServer = https.createServer(httpsOptions, (this as any).expressApp);

    await new Promise<void>((resolve, reject) => {
      this.httpsServer!.listen(this.httpsPort, this.listenAddr, () => {
        this.logger.log(`✅ HTTPS server listening on ${this.listenAddr}:${this.httpsPort}`);
        resolve();
      });

      this.httpsServer!.on('error', (error) => {
        this.logger.error(`HTTPS server error: ${error.message}`);
        reject(error);
      });
    });
  }

  /**
   * Stop HTTPS server gracefully
   */
  async stopHttpsServer(): Promise<void> {
    if (!this.httpsServer) {
      this.logger.debug('HTTPS server not running');
      return;
    }

    this.logger.log('Stopping HTTPS server...');

    await new Promise<void>((resolve) => {
      this.httpsServer!.close(() => {
        this.logger.log('HTTPS server stopped');
        resolve();
      });
    });

    this.httpsServer = undefined;
  }

  /**
   * Reload certificates with zero downtime
   * Creates new HTTPS server, then closes old one
   */
  async reloadCertificates(): Promise<void> {
    if (this.currentState !== SslServerState.HTTPS_ACTIVE) {
      throw new Error('Cannot reload certificates - HTTPS not active');
    }

    this.logger.log('Reloading certificates with zero downtime...');

    const sslConfig = await this.sslConfigService.getConfig();
    const domain = sslConfig.domain || this.extractDomainFromTooljetHost();

    if (!domain) {
      throw new Error('No domain configured');
    }

    const certPaths = this.getCertificatePaths(domain);

    // Read new certificates
    const httpsOptions = {
      key: fs.readFileSync(certPaths.privkeyPath),
      cert: fs.readFileSync(certPaths.fullchainPath),
    };

    // Create new HTTPS server
    const newHttpsServer = https.createServer(httpsOptions, (this as any).expressApp);

    // Start new server
    await new Promise<void>((resolve, reject) => {
      newHttpsServer.listen(this.httpsPort, this.listenAddr, () => {
        this.logger.log('New HTTPS server started with updated certificates');
        resolve();
      });

      newHttpsServer.on('error', (error) => {
        this.logger.error(`New HTTPS server error: ${error.message}`);
        reject(error);
      });
    });

    // Close old server (both servers briefly running)
    const oldServer = this.httpsServer;
    this.httpsServer = newHttpsServer;

    if (oldServer) {
      await new Promise<void>((resolve) => {
        oldServer.close(() => {
          this.logger.log('Old HTTPS server closed');
          resolve();
        });
      });
    }

    this.logger.log('Certificate reload complete - zero downtime');
  }

  /**
   * Check if certificate exists on filesystem
   */
  private checkCertificateExists(domain: string): boolean {
    try {
      const certPaths = this.getCertificatePaths(domain);
      return fs.existsSync(certPaths.privkeyPath) && fs.existsSync(certPaths.fullchainPath);
    } catch {
      return false;
    }
  }

  /**
   * Get certificate file paths for domain
   */
  private getCertificatePaths(domain: string): SslCertificatePaths {
    const certDir = path.join(this.CERT_BASE_PATH, domain);
    return {
      privkeyPath: path.join(certDir, 'privkey.pem'),
      fullchainPath: path.join(certDir, 'fullchain.pem'),
    };
  }

  /**
   * Extract domain from TOOLJET_HOST environment variable
   */
  private extractDomainFromTooljetHost(): string {
    const tooljetHost = process.env.TOOLJET_HOST;
    if (!tooljetHost) return '';

    try {
      const url = new URL(tooljetHost);
      return url.hostname;
    } catch {
      return '';
    }
  }

  /**
   * Graceful shutdown on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('SSL Server Manager shutting down...');

    // Close HTTPS server
    if (this.httpsServer) {
      await new Promise<void>((resolve) => {
        this.httpsServer!.close(() => {
          this.logger.log('HTTPS server closed');
          resolve();
        });
      });
    }

    // Close HTTP server
    if (this.httpServer) {
      await new Promise<void>((resolve) => {
        this.httpServer!.close(() => {
          this.logger.log('HTTP server closed');
          resolve();
        });
      });
    }

    this.logger.log('SSL Server Manager shutdown complete');
  }

  // Public getters for state inspection
  getState(): SslServerState {
    return this.currentState;
  }

  isHttpServerRunning(): boolean {
    return !!this.httpServer && this.httpServer.listening;
  }

  isHttpsServerRunning(): boolean {
    return !!this.httpsServer && this.httpsServer.listening;
  }

  getHttpPort(): number {
    return this.httpPort;
  }

  getHttpsPort(): number {
    return this.httpsPort;
  }
}
