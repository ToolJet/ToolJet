import { IsNotEmpty, IsString } from 'class-validator';

export class OnboardingCompletedDto {
  @IsString()
  @IsNotEmpty()
  region: string;
}
