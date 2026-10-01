import { IsObject, IsOptional, IsString } from 'class-validator';

export class ResolveApprovalDto {
  @IsString()
  outcome: string;

  @IsOptional()
  @IsObject()
  input?: Record<string, unknown>;
}
