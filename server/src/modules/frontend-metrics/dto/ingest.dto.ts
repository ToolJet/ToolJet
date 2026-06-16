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
  @IsEnum(VALID_EVENT_TYPES)
  type: ValidEventType;

  @IsNumber()
  @Min(0)
  ts: number;

  // Must be ≥ 0 — OTEL backends reject negative histogram observations.
  @IsNumber()
  @Min(0)
  @IsOptional()
  duration?: number;

  @IsObject()
  attrs: Record<string, string | number | boolean>;
}

export class IngestFrontendMetricsDto {
  @IsString()
  @MaxLength(50)
  collected_at: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMaxSize(200)
  @Type(() => FrontendMetricEventDto)
  events: FrontendMetricEventDto[];
}
