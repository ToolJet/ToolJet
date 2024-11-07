import { ImportTooljetDatabaseDto } from '@dto/import-resources.dto';
import { transformTjdbImportDto } from './tjdb-dto-transforms';
import { TransformFnParams } from 'class-transformer';

export const TjdbSchemaToLatestVersion = ({ value, obj }: TransformFnParams): ImportTooljetDatabaseDto[] => {
  if (!Array.isArray(value)) {
    console.error('Expected an array for tooljet_database, received:', value);
    return [];
  }

  const importingVersion = obj.tooljet_version;
  return value.map((tjdbImportDto: ImportTooljetDatabaseDto) => {
    return transformTjdbImportDto(tjdbImportDto, importingVersion);
  });
};
