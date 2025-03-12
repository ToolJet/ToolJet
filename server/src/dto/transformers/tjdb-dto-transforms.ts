// This file contains the transformation required for creating
// ToolJet Database from older versions.

import { ImportTooljetDatabaseDto } from '@dto/import-resources.dto';
import { isVersionGreaterThanOrEqual } from 'src/helpers/utils.helper';

// Transformations required to make schema corresponding to the
// version in the key to work with the current application's version.
//
// dto.schema here is the result of export from the view table API
// and the transformations done here is to make the creation work
// with create table API within TooljetDbTableOperationsService
const transformationsByVersion = {
  '2.30.0': (dto: ImportTooljetDatabaseDto) => {
    const transformedColumns = dto.schema.columns.map((col) => {
      col.constraints_type = {
        is_primary_key: col.constraint_type === 'PRIMARY KEY',
        is_not_null: col.is_nullable === 'NO',
      };
      return col;
    });
    dto.schema.columns = transformedColumns;
    return dto;
  },
  '2.42.0': (dto: ImportTooljetDatabaseDto) => {
    const transformedColumns = dto.schema.columns.map((col) => {
      col.constraints_type = {
        ...col.constraints_type,
        is_unique: false,
      };
      return col;
    });
    dto.schema = {
      columns: transformedColumns,
      foreign_keys: [],
    };
    return dto;
  },
};

export function transformTjdbImportDto(
  dto: ImportTooljetDatabaseDto,
  importingVersion: string
): ImportTooljetDatabaseDto {
  const versionsWithTransformations = Object.keys(transformationsByVersion);

  const transformedDto = versionsWithTransformations.reduce((acc, version) => {
    if (isVersionGreaterThanOrEqual(importingVersion, version)) return acc;

    const transformation = transformationsByVersion[version];
    return transformation(dto);
  }, dto);

  return transformedDto;
}
