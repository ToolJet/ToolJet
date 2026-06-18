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

const VALID_EVENT_TYPES = ['query_error', 'widget_error', 'js_error'] as const;

export type ValidEventType = typeof VALID_EVENT_TYPES[number];

export class FrontendMetricEventDto {
  @IsEnum(VALID_EVENT_TYPES)
  type: ValidEventType;

  @IsNumber()
  @Min(0)
  ts: number;

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
