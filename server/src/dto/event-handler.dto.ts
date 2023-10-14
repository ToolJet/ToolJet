import { IsNumber, IsObject, IsString } from 'class-validator';
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
