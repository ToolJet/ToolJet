import { Subject } from 'rxjs';

export interface ProcessInfo {
  task: string;
  process: () => Promise<any>;
  weightage?: number; // percentage, optional
}

export interface ProcessOptions {
  isRunParallel?: boolean; // default false
  isBreakOnError?: boolean; // default true
  userId?: string; // linked to jobId for auth validation
}

export interface ResolvedProcessInfo {
  task: string;
  weightage: number;
}

export interface SseProgressEvent {
  jobId: string;
  task: string;
  weightage: number;
  completedWeightage: number;
  status: 'running' | 'completed' | 'failed' | 'done';
  error?: string;
  result?: any;
}

export interface JobContext {
  subject: Subject<SseProgressEvent>;
  resolvedInfo: ResolvedProcessInfo[];
  userId?: string;
}
