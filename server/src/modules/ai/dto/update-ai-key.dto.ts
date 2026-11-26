import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

// Checks types only. licenseType and provider values are validated by the service, so its error messages stay as they are.
// Every field needs a decorator: the global ValidationPipe runs with whitelist: true and strips the rest.
export class UpdateAiKeyDto {
  @IsOptional()
  @IsString()
  apikey?: string;

  @IsString()
  licenseType: string;

  @IsOptional()
  @IsBoolean()
  useEnvironmentConfig?: boolean;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsNumber()
  modelContextWindow?: number;
}
