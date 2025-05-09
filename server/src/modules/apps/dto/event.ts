import { IsArray, IsIn, IsNumber, IsObject, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Target } from 'src/entities/event_handler.entity';

export class CreateEventHandlerDto {
  @IsObject()
  event: any;

  @IsString()
  eventType: Target;

  @IsString()
  attachedTo: string;

  @IsNumber()
  index: number;
}

class UpdateEventDiff {
  @IsString()
  name: string;

  @IsNumber()
  index: number;

  @IsObject()
  @ValidateNested()
  event: any;
}

export class UpdateEvent {
  @IsUUID()
  event_id: string;

  @IsObject()
  diff: UpdateEventDiff;
}

export class UpdateEventHandlerDto {
  @IsArray()
  events: UpdateEvent[];

  @IsIn(['update', 'reorder'])
  updateType: 'update' | 'reorder';
}
