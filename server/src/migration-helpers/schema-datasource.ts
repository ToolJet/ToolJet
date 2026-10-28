import { ormconfig } from 'ormconfig';
import { DataSource, DataSourceOptions } from 'typeorm';

const dataSource = new DataSource(ormconfig as DataSourceOptions);
export default dataSource;
