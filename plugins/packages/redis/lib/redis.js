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
const query_error_1 = require("common/lib/query.error");
const Redis = require('ioredis');
class RedisQueryService {
    run(sourceOptions, queryOptions, dataSourceId) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = {};
            const query = queryOptions.query;
            const client = yield this.getConnection(sourceOptions);
            try {
                const splitQuery = query.split(' ');
                const command = splitQuery[0];
                const args = splitQuery.length > 0 ? splitQuery.slice(1) : [];
                result = yield client.call(command, args);
            }
            catch (err) {
                client.disconnect();
                throw new query_error_1.QueryError('Query could not be completed', err.message, {});
            }
            return { status: 'ok', data: result };
        });
    }
    testConnection(sourceOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield this.getConnection(sourceOptions);
            yield client.ping();
            return {
                status: 'ok',
            };
        });
    }
    getConnection(sourceOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            const username = sourceOptions.username;
            const host = sourceOptions.host;
            const password = sourceOptions.password;
            const port = sourceOptions.port;
            const client = new Redis(port, host, { maxRetriesPerRequest: 1, username, password });
            return client;
        });
    }
}
exports.default = RedisQueryService;
//# sourceMappingURL=redis.js.map