import React from 'react';

import DynamicForm from '@/_components/DynamicForm';

import { Restapi } from './Restapi';
import { Runjs } from './Runjs';
import { Stripe } from './Stripe';

import MysqlSchema from './Mysql.schema.json';
import MssqlSchema from './Mssql.schema.json';
import GraphqlSchema from './Graphql.schema.json';
import RedisSchema from './Redis.schema.json';
import AirtableSchema from './Airtable.schema.json';
import DynamodbSchema from './Dynamodb.schema.json';
import FirestoreSchema from './Firestore.schema.json';
import ElasticsearchSchema from './Elasticsearch.schema.json';
import TypesenseSchema from './TypeSense.schema.json';
import MongodbSchema from './Mongodb.schema.json';
import PostgresqlSchema from './Postgresql.schema.json';
import SlackSchema from './Slack.schema.json';
import S3Schema from './S3.schema.json';
import MinioSchema from './Minio.schema.json';
import GooglesheetsSchema from './Googlesheets.schema.json';
import GcsSchema from './Gcs.schema.json';
import TwilioSchema from './Twilio.schema.json';
import SendgridSchema from './Sendgrid.schema.json';

const Mysql = ({ ...rest }) => <DynamicForm schema={MysqlSchema} {...rest} />;
const Mssql = ({ ...rest }) => <DynamicForm schema={MssqlSchema} {...rest} />;
const Graphql = ({ ...rest }) => <DynamicForm schema={GraphqlSchema} {...rest} />;
const Redis = ({ ...rest }) => <DynamicForm schema={RedisSchema} {...rest} />;
const Airtable = ({ ...rest }) => <DynamicForm schema={AirtableSchema} {...rest} />;
const Dynamodb = ({ ...rest }) => <DynamicForm schema={DynamodbSchema} {...rest} />;
const Firestore = ({ ...rest }) => <DynamicForm schema={FirestoreSchema} {...rest} />;
const Elasticsearch = ({ ...rest }) => <DynamicForm schema={ElasticsearchSchema} {...rest} />;
const Typesense = ({ ...rest }) => <DynamicForm schema={TypesenseSchema} {...rest} />;
const Mongodb = ({ ...rest }) => <DynamicForm schema={MongodbSchema} {...rest} />;
const Postgresql = ({ ...rest }) => <DynamicForm schema={PostgresqlSchema} {...rest} />;
const Slack = ({ ...rest }) => <DynamicForm schema={SlackSchema} {...rest} />;
const S3 = ({ ...rest }) => <DynamicForm schema={S3Schema} {...rest} />;
const Googlesheets = ({ ...rest }) => <DynamicForm schema={GooglesheetsSchema} {...rest} />;
const Gcs = ({ ...rest }) => <DynamicForm schema={GcsSchema} {...rest} />;
const Minio = ({ ...rest }) => <DynamicForm schema={MinioSchema} {...rest} />;
const Twilio = ({ ...rest }) => <DynamicForm schema={TwilioSchema} {...rest} />;
const Sendgrid = ({ ...rest }) => <DynamicForm schema={SendgridSchema} {...rest} />;

export const allSources = {
  Restapi,
  Runjs,
  Stripe,
  Mysql,
  Postgresql,
  Firestore,
  Redis,
  Googlesheets,
  Elasticsearch,
  Typesense,
  Slack,
  Mongodb,
  Dynamodb,
  Airtable,
  Graphql,
  Mssql,
  S3,
  Gcs,
  Minio,
  Twilio,
  Sendgrid,
};
