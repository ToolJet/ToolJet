import { UpdateLibraryDraftDto } from '../dto/lifecycle';
import { RunLibraryDraftDto } from '../dto/execution';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateLibraryQueryDto, UpdateLibraryQueryDto, ChangeLibraryDataSourceDto } from '../dto';
import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { QueryLibraryService } from '../service';
@Injectable()
export class ValidateLibraryDataSourceGuard implements CanActivate {
  constructor(private readonly service: QueryLibraryService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    if (request.params.environmentId !== undefined) {
      const dto = plainToInstance(RunLibraryDraftDto, request.body);
      const errors = validateSync(dto, { whitelist: true, forbidNonWhitelisted: true });
      if (errors.length)
        throw new BadRequestException(errors.flatMap((error) => Object.values(error.constraints ?? {})));
      const { dataSource } = await this.service.resolveRunTarget(request.user, request.tj_library_query, dto);
      request.tj_data_source = dataSource;
      request.tj_resource_id = dataSource.id;
      return true;
    }
    // Global pipes strip unknown properties before route pipes run. Reject them here, before that happens.
    const dtoType =
      request.method === 'PATCH'
        ? request.params.draftId
          ? UpdateLibraryDraftDto
          : UpdateLibraryQueryDto
        : request.method === 'PUT'
          ? ChangeLibraryDataSourceDto
          : CreateLibraryQueryDto;
    const dto = plainToInstance(dtoType as typeof CreateLibraryQueryDto, request.body);
    const errors = validateSync(dto, { whitelist: true, forbidNonWhitelisted: true });
    if (errors.length) throw new BadRequestException(errors.flatMap((error) => Object.values(error.constraints ?? {})));
    if (request.method === 'PATCH') return true; // The locked mutation authorizes the explicit stored snapshot.
    const sourceId = request.body.dataSourceId;
    const dataSource = await this.service.authorizeDataSource(request.user, sourceId);
    request.tj_data_source = dataSource;
    request.tj_resource_id = dataSource?.id;
    return true;
  }
}
