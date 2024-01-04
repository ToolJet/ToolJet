import { IsString, IsNotEmpty } from 'class-validator';

export class CopilotRequestDto {
  @IsString()
  @IsNotEmpty()
  query: string;

  @IsString()
  @IsNotEmpty()
  context: string;

  @IsNotEmpty()
  language: 'javascript' | 'python';
}

export class AddUpdateCopilitAPIKeyDto {
  @IsString()
  @IsNotEmpty()
  key: string;
}
