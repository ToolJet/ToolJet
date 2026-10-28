import { join } from 'path';
import ormconfig from 'data-migration-config';
import { DataSource, DataSourceOptions } from 'typeorm';

const dataSource = new DataSource({
  ...ormconfig,
  migrations: [join(__dirname, '../../migrations/contract/**/*{.ts,.js}')],
} as DataSourceOptions);
export default dataSource;
