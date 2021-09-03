import React from 'react';

import DynamicForm from '@/_components/DynamicForm';

import AirtableSchema from './Airtable.schema.json';
import RestapiSchema from './Restapi.schema.json';
import GraphqlSchema from './Graphql.schema.json';
import StripeSchema from './Stripe.schema.json';
import GooglesheetSchema from './Googlesheets.schema.json';
import SlackSchema from './Slack.schema.json';

import { Elasticsearch } from './Elasticsearch';
import { Redis } from './Redis';
import { Postgresql } from './Postgresql';
import { Mysql } from './Mysql';
import { Firestore } from './Firestore';
import { Mongodb } from './Mongodb';
import { Dynamodb } from './Dynamodb';
import { Mssql } from './Mssql';

const Airtable = ({ ...rest }) => <DynamicForm schema={AirtableSchema} {...rest} />;
const Restapi = ({ ...rest }) => <DynamicForm schema={RestapiSchema} {...rest} />;
const Graphql = ({ ...rest }) => <DynamicForm schema={GraphqlSchema} {...rest} />;
const Stripe = ({ ...rest }) => <DynamicForm schema={StripeSchema} {...rest} />;
const Googlesheets = ({ ...rest }) => <DynamicForm schema={GooglesheetSchema} {...rest} />;
const Slack = ({ ...rest }) => <DynamicForm schema={SlackSchema} {...rest} />;

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
