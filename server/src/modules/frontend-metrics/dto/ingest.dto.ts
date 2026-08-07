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
  Max,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

const VALID_EVENT_TYPES = ['js_error', 'widget_error', 'web_vital', 'app_load', 'app_load_failure'] as const;

export type ValidEventType = typeof VALID_EVENT_TYPES[number];

// Faro-compatible field names — destined for the logs pillar, never metric attrs
export class ErrorDetailDto {
  @IsString()
  @MaxLength(32)
  type: string;

  @IsString()
  @MaxLength(200)
  value: string;

  @IsString()
  @MaxLength(1000)
  @IsOptional()
  stacktrace?: string;
}

export class FrontendMetricEventDto {
  @IsEnum(VALID_EVENT_TYPES)
  type: ValidEventType;

  @IsNumber()
  @Min(0)
  firstSeen: number;

  @IsNumber()
  @Min(1)
  @Max(10_000)
  @IsOptional()
  count?: number;

  @IsNumber()
  @Min(0)
  @Max(3_600_000)
  @IsOptional()
  value?: number;

  @IsObject()
  attrs: Record<string, string | number | boolean>;

  @IsOptional()
  @ValidateNested()
  @Type(() => ErrorDetailDto)
  detail?: ErrorDetailDto;
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
