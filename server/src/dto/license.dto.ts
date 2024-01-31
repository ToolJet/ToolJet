import { IsNotEmpty, IsString } from 'class-validator';

export class LicenseUpdateDto {
  @IsNotEmpty({ message: 'Key should not be empty' })
  @IsString()
  key: string;
}
