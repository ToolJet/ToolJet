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
const operations_2 = require("./operations");
const { Client } = require('@elastic/elasticsearch');
class ElasticsearchService {
    run(sourceOptions, queryOptions, dataSourceId) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield this.getConnection(sourceOptions);
            let result = {};
            const operation = queryOptions.operation;
            try {
                switch (operation) {
                    case 'search':
                        result = yield (0, operations_2.search)(client, queryOptions.index, queryOptions.query);
                        break;
                    case 'index_document':
                        result = yield (0, operations_2.indexDocument)(client, queryOptions.index, queryOptions.body);
                        break;
                    case 'get':
                        result = yield (0, operations_1.getDocument)(client, queryOptions.index, queryOptions.id);
                        break;
                    case 'update':
                        result = yield (0, operations_1.updateDocument)(client, queryOptions.index, queryOptions.id, queryOptions.body);
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
            const client = yield this.getConnection(sourceOptions);
            yield client.info();
            return {
                status: 'ok',
            };
        });
    }
    getConnection(sourceOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            const scheme = sourceOptions.scheme;
            const host = sourceOptions.host;
            const port = sourceOptions.port;
            const username = sourceOptions.username;
            const password = sourceOptions.password;
            let url = '';
            if (username === '' || password === '') {
                url = `${scheme}://${username}:${password}@${host}:${port}`;
            }
            else {
                url = `${scheme}://${host}:${port}`;
            }
            return new Client({ node: url });
        });
    }
}
exports.default = ElasticsearchService;
//# sourceMappingURL=elasticsearch.js.map