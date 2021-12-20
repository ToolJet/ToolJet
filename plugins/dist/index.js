"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const airtable_1 = __importDefault(require("./packages/airtable/lib/airtable"));
const gcs_1 = __importDefault(require("./packages/gcs/lib/gcs"));
const dynamodb_1 = __importDefault(require("./packages/dynamodb/lib/dynamodb"));
const elasticsearch_1 = __importDefault(require("./packages/elasticsearch/lib/elasticsearch"));
const firestore_1 = __importDefault(require("./packages/firestore/lib/firestore"));
const googlesheets_1 = __importDefault(require("./packages/googlesheets/lib/googlesheets"));
const mongo_1 = __importDefault(require("./packages/mongo/lib/mongo"));
const mssql_1 = __importDefault(require("./packages/mssql/lib/mssql"));
const mysql_1 = __importDefault(require("./packages/mysql/lib/mysql"));
const postgresql_1 = __importDefault(require("./packages/postgresql/lib/postgresql"));
const redis_1 = __importDefault(require("./packages/redis/lib/redis"));
const restapi_1 = __importDefault(require("./packages/restapi/lib/restapi"));
const s3_1 = __importDefault(require("./packages/s3/lib/s3"));
const slack_1 = __importDefault(require("./packages/slack/lib/slack"));
const stripe_1 = __importDefault(require("./packages/stripe/lib/stripe"));
exports.default = {
    airtable: airtable_1.default,
    gcs: gcs_1.default,
    dynamodb: dynamodb_1.default,
    elasticsearch: elasticsearch_1.default,
    firestore: firestore_1.default,
    googlesheets: googlesheets_1.default,
    mongodb: mongo_1.default,
    mssql: mssql_1.default,
    mysql: mysql_1.default,
    postgresql: postgresql_1.default,
    redis: redis_1.default,
    restapi: restapi_1.default,
    s3: s3_1.default,
    slack: slack_1.default,
    stripe: stripe_1.default
};
//# sourceMappingURL=index.js.map