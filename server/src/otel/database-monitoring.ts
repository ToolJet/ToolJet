import { metrics } from '@opentelemetry/api';
import { DataSource } from 'typeorm';

export interface ConnectionPoolStats {
  totalConnections: number;
  idleConnections: number;
  waitingClients: number;
  activeConnections: number;
}

export class DatabaseMonitoring {
  private static instance: DatabaseMonitoring;
  private dataSource: DataSource | null = null;
  private connectionPoolGauge: any;
  private pendingRequestsGauge: any;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private meter: any = null;

  private constructor() {
    // Metrics will be initialized later via initializeMetrics()
  }
  
  public initializeMetrics(meter: any): void {
    console.log('[ToolJet Backend] DatabaseMonitoring: Initializing metrics with provided meter');
    this.meter = meter;
    
    // Create observable gauges for connection pool stats  
    this.connectionPoolGauge = meter.createObservableGauge('db_client_connection_count', {
      description: 'The number of connections that are currently in state described by the state attribute',
      unit: '{connection}',
    });
    
    this.pendingRequestsGauge = meter.createObservableGauge('db_client_connection_pending_requests', {
      description: 'The number of pending requests for an open connection, cumulative for the entire pool',
      unit: '{request}',
    });
    
    // Set up callbacks for observable gauges
    this.connectionPoolGauge.addCallback((observableResult: any) => {
      const stats = this.getConnectionPoolStats();
      if (stats && this.dataSource) {
        const poolName = this.dataSource?.options?.database || 'default';
        
        // Report current connection counts
        observableResult.observe(stats.idleConnections, { 
          'db.client.connection.state': 'idle',
          'db.client.connection.pool.name': poolName
        });
        
        observableResult.observe(stats.activeConnections, { 
          'db.client.connection.state': 'used',
          'db.client.connection.pool.name': poolName
        });
        
        console.log('[ToolJet Backend] Connection count metrics observed:', {
          idle: stats.idleConnections,
          used: stats.activeConnections,
          poolName
        });
      }
    });
    
    this.pendingRequestsGauge.addCallback((observableResult: any) => {
      const stats = this.getConnectionPoolStats();
      if (stats && this.dataSource) {
        const poolName = this.dataSource?.options?.database || 'default';
        observableResult.observe(stats.waitingClients, { 
          'db.client.connection.pool.name': poolName
        });
        console.log('[ToolJet Backend] Pending requests metric observed:', stats.waitingClients);
      }
    });
    
    console.log('[ToolJet Backend] DatabaseMonitoring: Metrics initialized successfully');
  }

  public static getInstance(): DatabaseMonitoring {
    if (!DatabaseMonitoring.instance) {
      DatabaseMonitoring.instance = new DatabaseMonitoring();
    }
    return DatabaseMonitoring.instance;
  }

  public setDataSource(dataSource: DataSource): void {
    console.log('[ToolJet Backend] DatabaseMonitoring: Setting DataSource');
    this.dataSource = dataSource;
    this.startMonitoring();
    console.log('[ToolJet Backend] DatabaseMonitoring: Started monitoring for database:', dataSource.options.database);
    
    // Test connection pool stats immediately
    const stats = this.getConnectionPoolStats();
    console.log('[ToolJet Backend] DatabaseMonitoring: Connection pool stats test:', stats);
  }

  private getConnectionPoolStats(): ConnectionPoolStats | null {
    try {
      if (!this.dataSource) {
        return null;
      }

      // TypeORM PostgreSQL driver pool access
      const driver = this.dataSource.driver as any;
      const pool = driver?.master?.pool || driver?.pool || driver?.master;
      
      if (!pool) {
        return null;
      }
      
      return {
        totalConnections: pool.totalCount || pool.size || 0,
        idleConnections: pool.idleCount || pool.available || 0,
        waitingClients: pool.waitingCount || pool.pending || 0,
        activeConnections: (pool.totalCount || pool.size || 0) - (pool.idleCount || pool.available || 0),
      };
    } catch (error) {
      return null;
    }
  }

  private startMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    // Monitor connection pool every 30 seconds for logging warnings only
    // Observable gauges are called automatically by the metrics reader
    this.monitoringInterval = setInterval(() => {
      const stats = this.getConnectionPoolStats();
      if (stats) {
        // Log warning if connection pool is under pressure
        const utilizationRate = stats.totalConnections > 0 
          ? stats.activeConnections / stats.totalConnections 
          : 0;

        if (utilizationRate > 0.8) {
          console.warn(`Database connection pool utilization high: ${(utilizationRate * 100).toFixed(1)}%`, {
            total: stats.totalConnections,
            active: stats.activeConnections,
            idle: stats.idleConnections,
            waiting: stats.waitingClients
          });
        }
      }
    }, 30000);
  }

  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  // Utility method to get current connection pool status
  public getCurrentStats(): ConnectionPoolStats | null {
    return this.getConnectionPoolStats();
  }

  // Utility method to check if database is healthy
  public async isHealthy(): Promise<{ healthy: boolean; stats?: ConnectionPoolStats; error?: string }> {
    try {
      if (!this.dataSource?.isInitialized) {
        return { healthy: false, error: 'Database connection not initialized' };
      }

      // Test connection with a simple query
      await this.dataSource.query('SELECT 1 as test');
      
      const stats = this.getConnectionPoolStats();
      
      return { 
        healthy: true, 
        stats: stats || undefined 
      };
    } catch (error) {
      return { 
        healthy: false, 
        error: error instanceof Error ? error.message : 'Unknown database error' 
      };
    }
  }
}

// Export singleton instance
export const databaseMonitoring = DatabaseMonitoring.getInstance();
