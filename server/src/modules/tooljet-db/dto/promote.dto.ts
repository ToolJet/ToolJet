import { IsNotEmpty, IsUUID } from 'class-validator';

export class PromoteTableDto {
  // The environment the caller is promoting *from*. The target is derived server-side as the
  // next-highest-priority environment above this one — never named by the client.
  @IsNotEmpty()
  @IsUUID()
  environment_id: string;
}
