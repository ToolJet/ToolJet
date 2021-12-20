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
const query_error_1 = require("common/lib/query.error");
const utils_helper_1 = require("common/lib/utils.helper");
class MssqlQueryService {
    run(sourceOptions, queryOptions, dataSourceId, dataSourceUpdatedAt) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = {};
            const query = queryOptions.query;
            const knexInstance = yield this.getConnection(sourceOptions, {}, true, dataSourceId, dataSourceUpdatedAt);
            try {
                result = yield knexInstance.raw(query);
            }
            catch (err) {
                throw new query_error_1.QueryError('Query could not be completed', err.message, {});
            }
            return { status: 'ok', data: result };
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
        return __awaiter(this, void 0, void 0, function* () {
            const config = {
                client: 'mssql',
                connection: {
                    host: sourceOptions.host,
                    user: sourceOptions.username,
                    password: sourceOptions.password,
                    database: sourceOptions.database,
                    port: sourceOptions.port,
                    options: {
                        encrypt: true,
                    },
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
}
exports.default = MssqlQueryService;
//# sourceMappingURL=mssql.js.map