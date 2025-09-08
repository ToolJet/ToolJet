import { Injectable } from '@nestjs/common';
import { databaseMonitoring } from './database-monitoring';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
      connectionPool?: {
        total: number;
        active: number;
        idle: number;
        waiting: number;
        utilization: number;
      };
      error?: string;
    };
  };
}

@Injectable()
export class OTELHealthCheckService {
  async getHealthStatus(): Promise<HealthCheckResult> {
    const timestamp = new Date().toISOString();
    const dbCheckStart = Date.now();
    
    const dbHealth = await databaseMonitoring.isHealthy();
    const dbResponseTime = Date.now() - dbCheckStart;
    
    const result: HealthCheckResult = {
      status: 'healthy',
      timestamp,
      services: {
        database: {
          status: dbHealth.healthy ? 'healthy' : 'unhealthy',
          responseTime: dbResponseTime,
          error: dbHealth.error,
        },
      },
    };

    // Add connection pool stats if available
    if (dbHealth.stats) {
      const utilization = dbHealth.stats.totalConnections > 0
        ? dbHealth.stats.activeConnections / dbHealth.stats.totalConnections
        : 0;

      result.services.database.connectionPool = {
        total: dbHealth.stats.totalConnections,
        active: dbHealth.stats.activeConnections,
        idle: dbHealth.stats.idleConnections,
        waiting: dbHealth.stats.waitingClients,
        utilization: Math.round(utilization * 100) / 100,
      };
    }

    // Determine overall health status
    if (!dbHealth.healthy) {
      result.status = 'unhealthy';
    } else if (dbResponseTime > 1000 || (result.services.database.connectionPool?.utilization || 0) > 0.8) {
      result.status = 'degraded';
    }

    return result;
  }

  // Get database statistics for monitoring dashboards
  async getDatabaseStats() {
    const stats = databaseMonitoring.getCurrentStats();
    const health = await databaseMonitoring.isHealthy();
    
    return {
      connectionPool: stats,
      healthy: health.healthy,
      error: health.error,
      timestamp: new Date().toISOString(),
    };
  }
}