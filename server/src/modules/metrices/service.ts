import { Injectable, OnModuleInit } from '@nestjs/common';
import * as client from 'prom-client';
import * as os from 'os';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly register = new client.Registry();

  private rssGauge: client.Gauge;
  private heapTotalGauge: client.Gauge;
  private heapUsedGauge: client.Gauge;
  private externalGauge: client.Gauge;

  private cpuUserGauge: client.Gauge;
  private cpuSystemGauge: client.Gauge;

  private loadAvgGauge: client.Gauge<string>;
  private freeMemGauge: client.Gauge;
  private totalMemGauge: client.Gauge;

  onModuleInit() {
    this.register.setDefaultLabels({ app: 'nestjs-app' });

    client.collectDefaultMetrics({ register: this.register });

    // Memory gauges
    this.rssGauge = new client.Gauge({
      name: 'nodejs_memory_rss_bytes',
      help: 'Resident Set Size memory in bytes',
      registers: [this.register],
    });
    this.heapTotalGauge = new client.Gauge({
      name: 'nodejs_memory_heap_total_bytes',
      help: 'Heap total memory in bytes',
      registers: [this.register],
    });
    this.heapUsedGauge = new client.Gauge({
      name: 'nodejs_memory_heap_used_bytes',
      help: 'Heap used memory in bytes',
      registers: [this.register],
    });
    this.externalGauge = new client.Gauge({
      name: 'nodejs_memory_external_bytes',
      help: 'External memory in bytes',
      registers: [this.register],
    });

    // CPU gauges
    this.cpuUserGauge = new client.Gauge({
      name: 'nodejs_cpu_user_seconds_total',
      help: 'User CPU time in seconds',
      registers: [this.register],
    });
    this.cpuSystemGauge = new client.Gauge({
      name: 'nodejs_cpu_system_seconds_total',
      help: 'System CPU time in seconds',
      registers: [this.register],
    });

    // Load averages
    this.loadAvgGauge = new client.Gauge({
      name: 'nodejs_load_average',
      help: 'Load average',
      labelNames: ['interval'],
      registers: [this.register],
    });

    // System memory
    this.freeMemGauge = new client.Gauge({
      name: 'system_memory_free_bytes',
      help: 'Free system memory in bytes',
      registers: [this.register],
    });
    this.totalMemGauge = new client.Gauge({
      name: 'system_memory_total_bytes',
      help: 'Total system memory in bytes',
      registers: [this.register],
    });
  }

  private updateMetrics() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const loadAvg = os.loadavg();

    // Memory
    this.rssGauge.set(memoryUsage.rss);
    this.heapTotalGauge.set(memoryUsage.heapTotal);
    this.heapUsedGauge.set(memoryUsage.heapUsed);
    this.externalGauge.set(memoryUsage.external);

    // CPU (µs → seconds)
    this.cpuUserGauge.set(cpuUsage.user / 1e6);
    this.cpuSystemGauge.set(cpuUsage.system / 1e6);

    // Load average
    this.loadAvgGauge.set({ interval: '1m' }, loadAvg[0]);
    this.loadAvgGauge.set({ interval: '5m' }, loadAvg[1]);
    this.loadAvgGauge.set({ interval: '15m' }, loadAvg[2]);

    // System memory
    this.freeMemGauge.set(os.freemem());
    this.totalMemGauge.set(os.totalmem());
  }

  async getPrometheusMetrics(): Promise<string> {
    this.updateMetrics();
    return this.register.metrics();
  }

  async getJsonMetrics() {
    this.updateMetrics();
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const loadAvg = os.loadavg();

    return {
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
      },
      cpu: {
        user: cpuUsage.user / 1000, // ms
        system: cpuUsage.system / 1000, // ms
      },
      system: {
        loadAverage: loadAvg,
        freeMemory: os.freemem(),
        totalMemory: os.totalmem(),
      },
      timestamp: new Date().toISOString(),
    };
  }
}
