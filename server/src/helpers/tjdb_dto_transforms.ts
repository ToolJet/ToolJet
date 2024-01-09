// This file contains the transformation required for creating
// ToolJet Database from older versions.

import { ImportTooljetDatabaseDto } from '@dto/import-resources.dto';
import { isVersionGreaterThanOrEqual } from './utils.helper';

const transformationsByVersion = {
  '2.27.4': (dto: ImportTooljetDatabaseDto) => {
    const transformedColumns = dto.schema.columns.map((col) => {
      if (col.constraint_type !== 'PRIMARY KEY') return col;

      col.constraints_type = { is_primary_key: true };
      return col;
    });
    dto.schema.columns = transformedColumns;
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
