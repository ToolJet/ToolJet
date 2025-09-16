import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as os from 'os';

@Injectable()
export class SystemMetricsService implements OnModuleInit, OnModuleDestroy {
  private intervalId: NodeJS.Timeout;

  onModuleInit() {
    // Log every 10 seconds
    this.intervalId = setInterval(() => {
      this.logMetrics();
    }, 10000);
  }

  onModuleDestroy() {
    clearInterval(this.intervalId);
  }

  private logMetrics() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    console.log('--- System Metrics ---');
    console.log(`RSS: ${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Heap Total: ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Heap Used: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`External: ${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`);

    console.log(`CPU User: ${(cpuUsage.user / 1000).toFixed(2)} ms, System: ${(cpuUsage.system / 1000).toFixed(2)} ms`);

    // Optional: System-wide info
    console.log(
      `Load Average: ${os
        .loadavg()
        .map((n) => n.toFixed(2))
        .join(', ')}`
    );
    console.log(`Free Memory: ${(os.freemem() / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Total Memory: ${(os.totalmem() / 1024 / 1024).toFixed(2)} MB`);
    console.log('----------------------\n');
  }
}
