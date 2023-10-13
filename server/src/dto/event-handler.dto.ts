import { IsString, IsUUID, IsObject, IsNumber, IsEnum, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { Target } from 'src/entities/event_handler.entity';

class EventActionDto {
  @IsString()
  eventId: string;

  @IsString()
  actionId: string;

  @IsString()
  message: string;

  @IsString()
  alertType: string;
}

class EventDto {
  @IsUUID()
  id: string;

  @IsString()
  name: string;

  @IsNumber()
  index: number;

  @ValidateNested()
  event: EventActionDto;

  @IsUUID()
  sourceId: string;

  @IsEnum(Target)
  target: Target;

  @IsUUID()
  appVersionId: string;

  @IsDateString()
  createdAt: Date;

  @IsDateString()
  updatedAt: Date;
}

export class CreateEventHandlerDto {
  @IsString()
  name: string;

  @IsNumber()
  index: number;

  @IsObject()
  event: EventActionDto;

  @IsUUID()
  sourceId: string;

  @IsEnum(Target)
  target: Target;

  @IsUUID()
  appVersionId: string;
}

export class UpdateEventHandlerDto {
  @IsUUID()
  event_id: string;

  @ValidateNested()
  diff: EventDto;
}

export class UpdateEventHandlersDto {
  @IsArray()
  @ValidateNested({ each: true })
  events: UpdateEventHandlerDto[];

  @IsString()
  updateType: 'update' | 'reorder';
}
