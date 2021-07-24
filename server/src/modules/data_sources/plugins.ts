import FirestoreQueryService from '@plugins/datasources/firestore';
import PostgresqlQueryService from '@plugins/datasources/postgresql';
import MysqlQueryService from '@plugins/datasources/mysql';
import ElasticsearchService from '@plugins/datasources/elasticsearch';
import MongodbService from '@plugins/datasources/mongodb';
import DynamodbQueryService from '@plugins/datasources/dynamodb';
import MssqlQueryService from '@plugins/datasources/mssql';
import RestapiQueryService from '@plugins/datasources/restapi';
import SlackQueryService from '@plugins/datasources/slack';
import RedisQueryService from '@plugins/datasources/redis';
import GooglesheetsQueryService from '@plugins/datasources/googlesheets';

export const allPlugins = {
  postgresql: PostgresqlQueryService,
  firestore: FirestoreQueryService,
  mysql: MysqlQueryService,
  elasticsearch: ElasticsearchService,
  mongodb: MongodbService,
  dynamodb: DynamodbQueryService,
  mssql: MssqlQueryService,
  restapi: RestapiQueryService,
  slack: SlackQueryService,
  redis: RedisQueryService,
  googlesheets: GooglesheetsQueryService,
}
