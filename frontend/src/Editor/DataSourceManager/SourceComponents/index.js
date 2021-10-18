import React from "react";

import DynamicForm from "@/_components/DynamicForm";

import AirtableSchema from "./Api/Airtable.schema.json";
import RestapiSchema from "./Api/Restapi.schema.json";
import GraphqlSchema from "./Api/Graphql.schema.json";
import StripeSchema from "./Api/Stripe.schema.json";
import GooglesheetSchema from "./Api/Googlesheets.schema.json";
import SlackSchema from "./Api/Slack.schema.json";

import DynamodbSchema from "./Database/Dynamodb.schema.json";
import ElasticsearchSchema from "./Database/Elasticsearch.schema.json";
import RedisSchema from "./Database/Redis.schema.json";
import FirestoreSchema from "./Database/Firestore.schema.json";
import MongodbSchema from "./Database/Mongodb.schema.json";
import PostgresqlSchema from "./Database/Postgresql.schema.json";
import MysqlSchema from "./Database/Mysql.schema.json";
import MssqlSchema from "./Database/Mssql.schema.json";

const Airtable = ({ ...rest }) => (
  <DynamicForm schema={AirtableSchema} {...rest} />
);
const Restapi = ({ ...rest }) => (
  <DynamicForm schema={RestapiSchema} {...rest} />
);
const Graphql = ({ ...rest }) => (
  <DynamicForm schema={GraphqlSchema} {...rest} />
);
const Stripe = ({ ...rest }) => <DynamicForm schema={StripeSchema} {...rest} />;
const Googlesheets = ({ ...rest }) => (
  <DynamicForm schema={GooglesheetSchema} {...rest} />
);
const Slack = ({ ...rest }) => <DynamicForm schema={SlackSchema} {...rest} />;
const Dynamodb = ({ ...rest }) => (
  <DynamicForm schema={DynamodbSchema} {...rest} />
);
const Elasticsearch = ({ ...rest }) => (
  <DynamicForm schema={ElasticsearchSchema} {...rest} />
);
const Redis = ({ ...rest }) => <DynamicForm schema={RedisSchema} {...rest} />;
const Firestore = ({ ...rest }) => (
  <DynamicForm schema={FirestoreSchema} {...rest} />
);
const Mongodb = ({ ...rest }) => (
  <DynamicForm schema={MongodbSchema} {...rest} />
);
const Postgresql = ({ ...rest }) => (
  <DynamicForm schema={PostgresqlSchema} {...rest} />
);
const Mysql = ({ ...rest }) => <DynamicForm schema={MysqlSchema} {...rest} />;
const Mssql = ({ ...rest }) => <DynamicForm schema={MssqlSchema} {...rest} />;

export const DataBaseSources = [
  DynamodbSchema.source,
  ElasticsearchSchema.source,
  RedisSchema.source,
  FirestoreSchema.source,
  MongodbSchema.source,
  PostgresqlSchema.source,
  MysqlSchema.source,
  MssqlSchema.source,
];
export const ApiSources = [
  AirtableSchema.source,
  RestapiSchema.source,
  GraphqlSchema.source,
  StripeSchema.source,
  GooglesheetSchema.source,
  SlackSchema.source,
];
export const DataSourceTypes = [...DataBaseSources, ...ApiSources];

export const SourceComponents = {
  Elasticsearch,
  Redis,
  Postgresql,
  Stripe,
  Firestore,
  Restapi,
  Googlesheets,
  Slack,
  Mongodb,
  Dynamodb,
  Airtable,
  Graphql,
  Mysql,
  Mssql,
};
