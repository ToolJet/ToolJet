import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class WorkflowConsumerDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  /** `front-end`, `workflow` or `module`. */
  @Expose()
  type: string;
}

@Exclude()
export class WorkflowConsumersResponseDto {
  @Expose()
  @Type(() => WorkflowConsumerDto)
  consumers: WorkflowConsumerDto[];
}
