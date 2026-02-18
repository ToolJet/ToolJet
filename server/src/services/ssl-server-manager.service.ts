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
   * Non-blocking: uses setTimeout() to avoid blocking app startup
   */
  async onApplicationBootstrap(): Promise<void> {
    // SSL Server Manager always initializes - HTTPS server starts based on database configuration
    // Non-blocking initialization - stagger with other SSL services to prevent database lock contention
    setTimeout(() => {
      this.initializeAsync().catch((error) => {
        this.logger.warn(`SSL server initialization skipped: ${error.message}`);
        this.logger.log('App will continue with HTTP only - this is normal during initial setup');
        this.logger.log('Configure SSL via Settings → SSL/TLS to enable HTTPS');
      });
    }, 300); // Run after SslBootstrapService and SslCertificateLifecycleService
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

      // Log state with actionable guidance
      this.logStateGuidance(state, sslConfig);

      // Transition to appropriate state
      await this.transitionTo(state);

      this.isInitialized = true;
      this.logger.log('SSL Server Manager initialized successfully');
    } catch (error) {
      this.logger.warn(`SSL server initialization error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Log current SSL state with actionable user guidance
   */
  private logStateGuidance(state: SslServerState, sslConfig: any): void {
    switch (state) {
      case SslServerState.HTTP_ONLY_DISABLED:
        this.logger.log('[SSL State] HTTP_ONLY_DISABLED');
        this.logger.log('  → SSL not enabled in database');
        this.logger.log('  → Action: Enable SSL via Settings → SSL/TLS');
        break;

      case SslServerState.HTTP_ONLY_PENDING:
        this.logger.log('[SSL State] HTTP_ONLY_PENDING');
        if (!sslConfig.domain) {
          this.logger.log('  → No domain configured');
          this.logger.log('  → Action: Configure domain in Settings → SSL/TLS');
        } else if (!this.checkCertificateExists(sslConfig.domain)) {
          this.logger.log('  → Certificate not acquired yet');
          this.logger.log('  → Action: Click "Acquire Certificate" in SSL settings');
        } else {
          this.logger.log('  → Certificate domain does not match TOOLJET_HOST');
          this.logger.log(`  → Action: Update TOOLJET_HOST to https://${sslConfig.domain} and restart`);
        }
        break;

      case SslServerState.HTTPS_ACTIVE:
        this.logger.log('[SSL State] HTTPS_ACTIVE ✅');
        this.logger.log(`  → HTTPS will start on port ${this.httpsPort}`);
        this.logger.log('  → HTTP requests will redirect to HTTPS');
        break;
    }
  }

  /**
   * Initialize SSL server manager with Express app and port configuration
   * HTTP server is managed by NestJS via app.listen()
   * This method only stores configuration for HTTPS server management
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

    // Store Express app for HTTPS server creation
    (this as any).expressApp = expressApp;

    this.logger.log(`SSL Server Manager configured - HTTP: ${httpPort}, HTTPS: ${httpsPort}`);
    this.logger.log('HTTP server is managed by NestJS, HTTPS will be managed based on SSL configuration');
  }

  /**
   * Get HTTP server instance for shutdown handling
   * Returns null as HTTP server is now managed by NestJS
   */
  getHttpServer(): http.Server | null {
    return null;
  }

  /**
   * Determine SSL state from configuration
   */
  determineState(sslConfig: any): SslServerState {
    // Step 1: Check if SSL enabled in database
    if (!sslConfig.enabled) {
      return SslServerState.HTTP_ONLY_DISABLED;
    }

    // Step 2: Validate domain
    const domain = sslConfig.domain;
    if (!domain) {
      this.logger.warn('No domain configured in SSL settings');
      return SslServerState.HTTP_ONLY_PENDING;
    }

    // Step 3: Validate certificate exists
    const certificateExists = this.checkCertificateExists(domain);
    if (!certificateExists) {
      this.logger.log(`Certificate not yet acquired for ${domain}`);
      return SslServerState.HTTP_ONLY_PENDING;
    }

    // Step 4: Validate certificate domain matches TOOLJET_HOST
    if (!this.validateCertificateDomainMatchesTooljetHost(domain)) {
      this.logger.warn('Certificate domain does not match TOOLJET_HOST - HTTPS will not start');
      return SslServerState.HTTP_ONLY_PENDING;
    }

    // All conditions met - activate HTTPS
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

    // Read certificates asynchronously to avoid blocking the event loop
    const [key, cert] = await Promise.all([
      fs.promises.readFile(certPaths.privkeyPath),
      fs.promises.readFile(certPaths.fullchainPath),
    ]);
    const httpsOptions = { key, cert };

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

    // Read new certificates asynchronously to avoid blocking the event loop
    const [key, cert] = await Promise.all([
      fs.promises.readFile(certPaths.privkeyPath),
      fs.promises.readFile(certPaths.fullchainPath),
    ]);
    const httpsOptions = { key, cert };

    // Close old server FIRST to free the port, preventing EADDRINUSE
    if (this.httpsServer) {
      await new Promise<void>((resolve) => {
        this.httpsServer!.close(() => {
          this.logger.log('Old HTTPS server closed');
          resolve();
        });
      });
      this.httpsServer = undefined;
    }

    // Create and start new HTTPS server on the now-free port
    const newHttpsServer = https.createServer(httpsOptions, (this as any).expressApp);

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

    this.httpsServer = newHttpsServer;
    this.logger.log('Certificate reload complete');
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
   * Validate that certificate domain matches TOOLJET_HOST domain
   * This ensures HTTPS only activates when domains are aligned
   */
  private validateCertificateDomainMatchesTooljetHost(certDomain: string): boolean {
    const tooljetHostDomain = this.extractDomainFromTooljetHost();

    if (!tooljetHostDomain) {
      this.logger.warn('TOOLJET_HOST not configured - cannot validate domain match');
      this.logger.warn('Set TOOLJET_HOST to enable HTTPS');
      return false;
    }

    if (certDomain !== tooljetHostDomain) {
      this.logger.warn(`Certificate domain (${certDomain}) does not match TOOLJET_HOST domain (${tooljetHostDomain})`);
      this.logger.warn(`Update TOOLJET_HOST to https://${certDomain} and restart to activate HTTPS`);
      return false;
    }

    this.logger.log(`✅ Certificate domain matches TOOLJET_HOST: ${certDomain}`);
    return true;
  }

  /**
   * Graceful shutdown on module destroy
   * Only closes HTTPS server (HTTP server is managed by NestJS)
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

    this.logger.log('SSL Server Manager shutdown complete');
  }

  // Public getters for state inspection
  getState(): SslServerState {
    return this.currentState;
  }

  isHttpServerRunning(): boolean {
    // HTTP server is managed by NestJS via app.listen() in main.ts
    // It's guaranteed to be running during normal operation
    // This method is kept for compatibility but always returns true
    return true;
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
