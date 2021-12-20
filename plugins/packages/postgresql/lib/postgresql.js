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
const utils_helper_1 = require("common/lib/utils.helper");
const { Pool } = require('pg');
class PostgresqlQueryService {
    run(sourceOptions, queryOptions, dataSourceId, dataSourceUpdatedAt) {
        return __awaiter(this, void 0, void 0, function* () {
            const pool = yield this.getConnection(sourceOptions, {}, true, dataSourceId, dataSourceUpdatedAt);
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
            result = yield pool.query(query);
            return {
                status: 'ok',
                data: result.rows,
            };
        });
    }
    testConnection(sourceOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            const pool = yield this.getConnection(sourceOptions, {}, false);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const result = yield pool.query('SELECT version();');
            return {
                status: 'ok',
            };
        });
    }
    buildConnection(sourceOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            const poolConfig = {
                user: sourceOptions.username,
                host: sourceOptions.host,
                database: sourceOptions.database,
                password: sourceOptions.password,
                port: sourceOptions.port,
                statement_timeout: 10000,
                connectionTimeoutMillis: 10000,
            };
            if (sourceOptions.ssl_enabled)
                poolConfig['ssl'] = { rejectUnauthorized: false };
            return new Pool(poolConfig);
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
exports.default = PostgresqlQueryService;
//# sourceMappingURL=postgresql.js.map