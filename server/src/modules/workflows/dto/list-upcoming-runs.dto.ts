import { PickType } from '@nestjs/mapped-types';
import { ListExecutionsDto } from './list-executions.dto';

// The executions list's scope selectors, so both halves of the dashboard validate them alike.
export class ListUpcomingRunsDto extends PickType(ListExecutionsDto, ['app_id', 'folder_id', 'environment_id']) {}
