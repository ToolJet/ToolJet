import ormconfig from 'data-migration-config';
import { DataSource, DataSourceOptions } from 'typeorm';

const dataSource = new DataSource(ormconfig as DataSourceOptions);
export default dataSource;
