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

const VALID_EVENT_TYPES = ['js_error', 'widget_error', 'web_vital'] as const;

export type ValidEventType = typeof VALID_EVENT_TYPES[number];

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
