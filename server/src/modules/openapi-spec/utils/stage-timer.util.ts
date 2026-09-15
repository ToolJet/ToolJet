import * as v8 from 'v8';

interface Mark {
  label: string;
  atMs: number;
  heapUsedMB: number;
  rssMB: number;
}

export interface StageSummary {
  label: string;
  durationMs: number;
  heapUsedMB: number;
  rssMB: number;
  heapDeltaMB: number;
}

export interface TimerSummary {
  totalMs: number;
  peakHeapUsedMB: number;
  peakRssMB: number;
  defaultHeapLimitMB: number;
  stages: StageSummary[];
}

// Logs elapsed time and memory per named stage, to diagnose slow or large jobs.
export class StageTimer {
  private readonly marks: Mark[] = [];
  readonly defaultHeapLimitMB: number;

  constructor() {
    this.defaultHeapLimitMB = Math.round(v8.getHeapStatistics().heap_size_limit / 1024 / 1024);
    this.mark('start');
  }

  mark(label: string): void {
    const mem = process.memoryUsage();
    this.marks.push({
      label,
      atMs: Date.now(),
      heapUsedMB: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
      rssMB: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
    });
  }

  summary(): TimerSummary {
    const stages: StageSummary[] = [];
    for (let i = 1; i < this.marks.length; i++) {
      const prev = this.marks[i - 1];
      const curr = this.marks[i];
      stages.push({
        label: curr.label,
        durationMs: curr.atMs - prev.atMs,
        heapUsedMB: curr.heapUsedMB,
        rssMB: curr.rssMB,
        heapDeltaMB: Math.round((curr.heapUsedMB - prev.heapUsedMB) * 100) / 100,
      });
    }

    return {
      totalMs: this.marks[this.marks.length - 1].atMs - this.marks[0].atMs,
      peakHeapUsedMB: Math.max(...this.marks.map((m) => m.heapUsedMB)),
      peakRssMB: Math.max(...this.marks.map((m) => m.rssMB)),
      defaultHeapLimitMB: this.defaultHeapLimitMB,
      stages,
    };
  }
}
