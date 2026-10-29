export interface ComponentHealth {
  status: 'ok' | 'error' | 'not_configured';
  latency_ms?: number;
  message?: string;
}

export interface DbHealthVerbose extends ComponentHealth {
  type: string;
  pool?: {
    active: number;
    idle: number;
    total: number;
  };
}

export interface CacheHealthVerbose extends ComponentHealth {
  type: string;
  memory?: {
    used_mb: number;
    peak_mb: number;
    usage_percent: number;
  };
  stats?: {
    connected_clients: number;
    hit_rate_percent: number;
    uptime_seconds: number;
  };
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  isLicenseValid: boolean;
  isExpired: boolean;
  components: {
    database: ComponentHealth | DbHealthVerbose;
    cache: ComponentHealth | CacheHealthVerbose;
  };
  uptime_seconds?: number;
}

export interface IAppService {
  getHealth(verbose?: boolean): Promise<HealthResponse>;
}
