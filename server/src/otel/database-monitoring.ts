import { metrics } from '@opentelemetry/api';
import { DataSource } from 'typeorm';

interface ConnectionPoolStats {
  totalConnections: number;
  idleConnections: number;
  waitingClients: number;
  activeConnections: number;
}

export class DatabaseMonitoring {
  private static instance: DatabaseMonitoring;
  private dataSource: DataSource | null = null;
  private connectionPoolGauge: any;
  private monitoringInterval: NodeJS.Timeout | null = null;

  private constructor() {
    const meter = metrics.getMeter('tooljet-database-pool', '1.0.0');
    this.connectionPoolGauge = meter.createObservableGauge('db_connection_pool_stats', {
      description: 'Database connection pool detailed statistics',
    });
  }

  public static getInstance(): DatabaseMonitoring {
    if (!DatabaseMonitoring.instance) {
      DatabaseMonitoring.instance = new DatabaseMonitoring();
    }
    return DatabaseMonitoring.instance;
  }

  public setDataSource(dataSource: DataSource): void {
    this.dataSource = dataSource;
    this.startMonitoring();
  }

  private getConnectionPoolStats(): ConnectionPoolStats | null {
    try {
      // TypeORM PostgreSQL driver pool access
      const driver = this.dataSource?.driver as any;
      const pool = driver?.master?.pool || driver?.pool;
      
      if (!pool) {
        return null;
      }
      
      return {
        totalConnections: pool.totalCount || 0,
        idleConnections: pool.idleCount || 0,
        waitingClients: pool.waitingCount || 0,
        activeConnections: (pool.totalCount || 0) - (pool.idleCount || 0),
      };
    } catch (error) {
      // Silently handle connection pool access errors
      return null;
    }
  }

  private startMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    // Monitor connection pool every 30 seconds
    this.monitoringInterval = setInterval(() => {
      const stats = this.getConnectionPoolStats();
      if (stats) {
        // Record connection pool metrics
        this.connectionPoolGauge.addCallback((observableResult: any) => {
          observableResult.observe(stats.totalConnections, { 
            stat: 'total',
            database: this.dataSource?.options?.database || 'unknown'
          });
          observableResult.observe(stats.idleConnections, { 
            stat: 'idle',
            database: this.dataSource?.options?.database || 'unknown'
          });
          observableResult.observe(stats.waitingClients, { 
            stat: 'waiting',
            database: this.dataSource?.options?.database || 'unknown'
          });
          observableResult.observe(stats.activeConnections, { 
            stat: 'active',
            database: this.dataSource?.options?.database || 'unknown'
          });
        });

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
