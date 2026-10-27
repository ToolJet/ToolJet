import { Exclude, Expose, Type } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { MigrationStepStatus } from '../../../../migration-helpers/migration-run-log';
import { MigrationRunStatus, MigrationState } from '../service';

export class MigrationRunLogQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  migration?: string;
}

@Exclude()
export class MigrationStepResponseDto {
  @Expose() name: string;
  @Expose() status: MigrationStepStatus;
  @Expose() percent?: number;
  @Expose() durationMs?: number;
}

@Exclude()
export class MigrationRunResponseDto {
  @Expose() id: string;
  @Expose() fromVersion: string | null;
  @Expose() toVersion: string;
  @Expose() status: MigrationRunStatus;
  @Expose() migrationsDone: number;
  @Expose() migrationsTotal: number;
  @Expose() @Type(() => MigrationStepResponseDto) migrations: MigrationStepResponseDto[];
  @Expose() logTail: string[];
  @Expose() error: string | null;
  @Expose() triggeredBy: string;
  @Expose() startedAt: string;
  @Expose() finishedAt: string | null;
}

@Exclude()
export class MigrationRunsResponseDto {
  @Expose() @Type(() => MigrationRunResponseDto) runs: MigrationRunResponseDto[];
}

@Exclude()
export class MigrationRunLogResponseDto {
  @Expose() log: string;
}

@Exclude()
export class MigrationStatusResponseDto {
  @Expose() state: MigrationState;
  @Expose() startedAt?: string;
  @Expose() toVersion?: string;
  @Expose() endUserMessage?: string;
}
