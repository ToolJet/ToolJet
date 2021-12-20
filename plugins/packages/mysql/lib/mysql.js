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
const knex_1 = require("knex");
const utils_helper_1 = require("common/lib/utils.helper");
class MysqlQueryService {
    run(sourceOptions, queryOptions, dataSourceId, dataSourceUpdatedAt) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = {
                rows: [],
            };
            let query = '';
            if (queryOptions.mode === 'gui') {
                if (queryOptions.operation === 'bulk_update_pkey') {
                    query = yield this.buildBulkUpdateQuery(queryOptions);
                }
            }
            else {
                query = queryOptions.query;
            }
            const knexInstance = yield this.getConnection(sourceOptions, {}, true, dataSourceId, dataSourceUpdatedAt);
            try {
                result = yield knexInstance.raw(query);
            }
            catch (err) {
                console.log(err);
            }
            return {
                status: 'ok',
                data: result[0],
            };
        });
    }
    testConnection(sourceOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            const knexInstance = yield this.getConnection(sourceOptions, {}, false);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const result = yield knexInstance.raw('select @@version;');
            return {
                status: 'ok',
            };
        });
    }
    buildConnection(sourceOptions) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const config = {
                client: 'mysql',
                connection: {
                    host: sourceOptions.host,
                    user: sourceOptions.username,
                    password: sourceOptions.password,
                    database: sourceOptions.database,
                    port: sourceOptions.port,
                    multipleStatements: true,
                    ssl: (_a = sourceOptions.ssl_enabled) !== null && _a !== void 0 ? _a : false, // Disabling by default for backward compatibility
                },
            };
            return (0, knex_1.knex)(config);
        });
    }
    getConnection(sourceOptions, options, checkCache, dataSourceId, dataSourceUpdatedAt) {
        return __awaiter(this, void 0, void 0, function* () {
            if (checkCache) {
                let connection = yield (0, utils_helper_1.getCachedConnection)(dataSourceId, dataSourceUpdatedAt);
                if (connection) {
                    return connection;
                }
                else {
                    connection = yield this.buildConnection(sourceOptions);
                    yield (0, utils_helper_1.cacheConnection)(dataSourceId, connection);
                    return connection;
                }
            }
            else {
                return yield this.buildConnection(sourceOptions);
            }
        });
    }
    buildBulkUpdateQuery(queryOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            let queryText = '';
            const tableName = queryOptions['table'];
            const primaryKey = queryOptions['primary_key_column'];
            const records = queryOptions['records'];
            for (const record of records) {
                queryText = `${queryText} UPDATE ${tableName} SET`;
                for (const key of Object.keys(record)) {
                    if (key !== primaryKey) {
                        queryText = ` ${queryText} ${key} = '${record[key]}',`;
                    }
                }
                queryText = queryText.slice(0, -1);
                queryText = `${queryText} WHERE ${primaryKey} = ${record[primaryKey]};`;
            }
            return queryText.trim();
        });
    }
}
exports.default = MysqlQueryService;
//# sourceMappingURL=mysql.js.map