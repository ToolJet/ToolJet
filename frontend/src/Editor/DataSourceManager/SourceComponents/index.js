import React from 'react';

import DynamicForm from '@/_components/DynamicForm';

import AirtableSchema from './Api/Airtable.schema.json';
import RestapiSchema from './Api/Restapi.schema.json';
import GraphqlSchema from './Api/Graphql.schema.json';
import StripeSchema from './Api/Stripe.schema.json';
import GooglesheetSchema from './Api/Googlesheets.schema.json';
import SlackSchema from './Api/Slack.schema.json';

import DynamodbSchema from './Database/Dynamodb.schema.json';

import { Elasticsearch } from './Elasticsearch';
import { Redis } from './Redis';
import { Postgresql } from './Postgresql';
import { Mysql } from './Mysql';
import { Firestore } from './Firestore';
import { Mongodb } from './Mongodb';
import { Mssql } from './Mssql';

const Airtable = ({ ...rest }) => <DynamicForm schema={AirtableSchema} {...rest} />;
const Restapi = ({ ...rest }) => <DynamicForm schema={RestapiSchema} {...rest} />;
const Graphql = ({ ...rest }) => <DynamicForm schema={GraphqlSchema} {...rest} />;
const Stripe = ({ ...rest }) => <DynamicForm schema={StripeSchema} {...rest} />;
const Googlesheets = ({ ...rest }) => <DynamicForm schema={GooglesheetSchema} {...rest} />;
const Slack = ({ ...rest }) => <DynamicForm schema={SlackSchema} {...rest} />;
const Dynamodb = ({ ...rest }) => <DynamicForm schema={DynamodbSchema} {...rest} />;

export const SourceComponents = {
  Elasticsearch,
  Redis,
  Postgresql,
  Mysql,
  Stripe,
  Firestore,
  Restapi,
  Googlesheets,
  Slack,
  Mongodb,
  Dynamodb,
  Airtable,
  Graphql,
  Mssql,
};
