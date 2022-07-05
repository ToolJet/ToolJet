import { IsNotEmpty } from 'class-validator';

export class CreateFileDto {
  @IsNotEmpty()
  data: Uint8Array | Buffer | string;

  @IsNotEmpty()
  filename: string;
}
