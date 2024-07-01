import { ImportTooljetDatabaseDto } from '@dto/import-resources.dto';
import { transformTjdbImportDto } from 'src/helpers/tjdb_dto_transforms';

export const transformTJDB = ({ obj }: any) => {
  let transformedTooljetDatabase: ImportTooljetDatabaseDto | undefined;
  if (obj.tooljet_database) {
    const importingVersion = obj.tooljet_version;
    transformedTooljetDatabase = obj.tooljet_database.map((tjdbImportDto: ImportTooljetDatabaseDto) => {
      return transformTjdbImportDto(tjdbImportDto, importingVersion);
    });
  }
  return transformedTooljetDatabase;
};
