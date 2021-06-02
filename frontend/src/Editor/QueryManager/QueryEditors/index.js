import { Restapi } from './Restapi';
import { Mysql } from './Mysql';
import { Postgresql } from './Postgresql';
import { Stripe } from './Stripe';
import { Firestore } from './Firestore';
import { Redis } from './Redis';
import { Googlesheets } from './Googlesheets';
import { Elasticsearch } from './Elasticsearch';
import { Slack } from './Slack';
import { Mongodb } from './Mongodb';
import { Dynamodb } from './Dynamodb';
import { Airtable } from './Airtable';

export const allSources = {
  Restapi,
  Mysql,
  Postgresql,
  Stripe,
  Firestore,
  Redis,
  Googlesheets,
  Elasticsearch,
  Slack,
  Mongodb,
  Dynamodb,
  Airtable
};
