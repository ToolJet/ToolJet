"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const operations_1 = require("./operations");
const AWS = require('aws-sdk');
class DynamodbQueryService {
    run(sourceOptions, queryOptions, dataSourceId) {
        return __awaiter(this, void 0, void 0, function* () {
            const operation = queryOptions.operation;
            const client = yield this.getConnection(sourceOptions, { operation });
            let result = {};
            try {
                switch (operation) {
                    case 'list_tables':
                        result = yield (0, operations_1.listTables)(client);
                        break;
                    case 'get_item':
                        result = yield (0, operations_1.getItem)(client, queryOptions.table, JSON.parse(queryOptions.key));
                        break;
                    case 'delete_item':
                        result = yield (0, operations_1.deleteItem)(client, queryOptions.table, JSON.parse(queryOptions.key));
                        break;
                    case 'query_table':
                        result = yield (0, operations_1.queryTable)(client, JSON.parse(queryOptions['query_condition']));
                        break;
                    case 'scan_table':
                        result = yield (0, operations_1.scanTable)(client, JSON.parse(queryOptions['scan_condition']));
                        break;
                }
            }
            catch (err) {
                console.log(err);
            }
            return {
                status: 'ok',
                data: result,
            };
        });
    }
    testConnection(sourceOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield this.getConnection(sourceOptions, { operation: 'list_tables' });
            yield (0, operations_1.listTables)(client);
            return {
                status: 'ok',
            };
        });
    }
    getConnection(sourceOptions, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const credentials = new AWS.Credentials(sourceOptions['access_key'], sourceOptions['secret_key']);
            const region = sourceOptions['region'];
            if (options['operation'] == 'list_tables') {
                return new AWS.DynamoDB({ region, credentials });
            }
            else {
                return new AWS.DynamoDB.DocumentClient({ region, credentials });
            }
        });
    }
}
exports.default = DynamodbQueryService;
//# sourceMappingURL=dynamodb.js.map