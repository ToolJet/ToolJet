import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
  IsObject,
  MaxLength,
  Min,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

// Mirror of FrontendMetricEventType in frontend-metrics.ts (kept in sync manually)
const VALID_EVENT_TYPES = [
  'page_view',
  'page_load',
  'app_open',
  'app_load',
  'query_exec',
  'query_error',
  'widget_render',
  'widget_error',
  'js_error',
] as const;

export type ValidEventType = typeof VALID_EVENT_TYPES[number];

export class FrontendMetricEventDto {
  /** Event type key — limits cardinality to a known set of values */
  @IsEnum(VALID_EVENT_TYPES)
  type: ValidEventType;

  /** Client timestamp (ms since epoch) — must be a reasonable positive number */
  @IsNumber()
  @Min(0)
  ts: number;

  /**
   * Duration in ms — required for histogram events; must be ≥ 0 to avoid
   * negative histogram observations that most OTEL backends reject.
   */
  @IsNumber()
  @Min(0)
  @IsOptional()
  duration?: number;

  /**
   * Metric attributes. Bounded to prevent unbounded cardinality:
   * - Values limited to 200 chars each (string coerced by the OTEL SDK anyway)
   * - Key count capped at 20 per event in service.ts
   */
  @IsObject()
  attrs: Record<string, string | number | boolean>;
}

export class IngestFrontendMetricsDto {
  /** ISO8601 timestamp when the batch was assembled on the client */
  @IsString()
  @MaxLength(50)
  collected_at: string;

  /** ToolJet workspace / organisation ID known by the client (server-side wins) */
  @IsString()
  @MaxLength(100)
  @IsOptional()
  workspace_id?: string;

  /** Metric events in this batch — capped at 200 by service.ts */
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMaxSize(200)
  @Type(() => FrontendMetricEventDto)
  events: FrontendMetricEventDto[];
}
