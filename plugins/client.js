
import Airtable from './packages/airtable/lib/manifest.json'
import Dynamodb from './packages/dynamodb/lib/manifest.json'
import Elasticsearch from './packages/elasticsearch/lib/manifest.json'
import Firestore from './packages/firestore/lib/manifest.json'
import Gcs from './packages/gcs/lib/manifest.json'
import Googlesheets from './packages/googlesheets/lib/manifest.json'
import Graphql from './packages/graphql/lib/manifest.json'
import Mongodb from './packages/mongo/lib/manifest.json'
import Mssql from './packages/mssql/lib/manifest.json'
import Mysql from './packages/mysql/lib/manifest.json'
import Postgresql from './packages/postgresql/lib/manifest.json'
import Redis from './packages/redis/lib/manifest.json'
import Restapi from './packages/restapi/lib/manifest.json'
import S3 from './packages/s3/lib/manifest.json'
import Sendgrid from './packages/sendgrid/lib/manifest.json'
import Slack from './packages/slack/lib/manifest.json'
import Stripe from './packages/stripe/lib/manifest.json'
import Twilio from './packages/twilioapi/lib/manifest.json'
import Typesense from './packages/typesenseapi/lib/manifest.json' 

import AirtableOperation from './packages/airtable/lib/operations.json'
import DynamodbOperation from './packages/dynamodb/lib/operations.json'
import ElasticsearchOperation from './packages/elasticsearch/lib/operations.json'
import FirestoreOperation from './packages/firestore/lib/operations.json'
import GcsOperation from './packages/gcs/lib/operations.json'
import GooglesheetsOperation from './packages/googlesheets/lib/operations.json'
import GraphqlOperation from './packages/graphql/lib/operations.json'
import MongodbOperation from './packages/mongo/lib/operations.json'
import MssqlOperation from './packages/mssql/lib/operations.json'
import MysqlOperation from './packages/mysql/lib/operations.json'
import PostgresqlOperation from './packages/postgresql/lib/operations.json'
import RedisOperation from './packages/redis/lib/operations.json'
import RestapiOperation from './packages/restapi/lib/operations.json'
import S3Operation from './packages/s3/lib/operations.json'
import SendgridOperation from './packages/sendgrid/lib/operations.json'
import SlackOperation from './packages/slack/lib/operations.json'
import StripeOperation from './packages/stripe/lib/operations.json'
import TwilioOperation from './packages/twilioapi/lib/operations.json'
import TypesenseOperation from './packages/typesenseapi/lib/operations.json' 

export const allManifests = {
 Airtable,
Dynamodb,
Elasticsearch,
Firestore,
Gcs,
Googlesheets,
Graphql,
Mongodb,
Mssql,
Mysql,
Postgresql,
Redis,
Restapi,
S3,
Sendgrid,
Slack,
Stripe,
Twilio,
Typesense 
 }

export const allOperations = {
 Airtable: AirtableOperation,
Dynamodb: DynamodbOperation,
Elasticsearch: ElasticsearchOperation,
Firestore: FirestoreOperation,
Gcs: GcsOperation,
Googlesheets: GooglesheetsOperation,
Graphql: GraphqlOperation,
Mongodb: MongodbOperation,
Mssql: MssqlOperation,
Mysql: MysqlOperation,
Postgresql: PostgresqlOperation,
Redis: RedisOperation,
Restapi: RestapiOperation,
S3: S3Operation,
Sendgrid: SendgridOperation,
Slack: SlackOperation,
Stripe: StripeOperation,
Twilio: TwilioOperation,
Typesense: TypesenseOperation 
 }

