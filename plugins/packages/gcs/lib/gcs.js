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
const storage_1 = require("@google-cloud/storage");
const query_error_1 = require("common/lib/query.error");
const operations_1 = require("./operations");
class GcsQueryService {
    run(sourceOptions, queryOptions, _dataSourceId) {
        return __awaiter(this, void 0, void 0, function* () {
            const operation = queryOptions.operation;
            const client = yield this.getConnection(sourceOptions);
            let result = {};
            try {
                switch (operation) {
                    case 'list_buckets':
                        result = yield (0, operations_1.listBuckets)(client, {});
                        break;
                    case 'list_files':
                        result = yield (0, operations_1.listFiles)(client, queryOptions);
                        break;
                    case 'get_file':
                        result = yield (0, operations_1.getFile)(client, queryOptions);
                        break;
                    case 'upload_file':
                        result = yield (0, operations_1.uploadFile)(client, queryOptions);
                        break;
                    case 'signed_url_for_get':
                        result = yield (0, operations_1.signedUrlForGet)(client, queryOptions);
                        break;
                    case 'signed_url_for_put':
                        result = yield (0, operations_1.signedUrlForPut)(client, queryOptions);
                        break;
                }
            }
            catch (error) {
                throw new query_error_1.QueryError('Query could not be completed', error.message, {});
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
            yield (0, operations_1.listBuckets)(client, {});
            return {
                status: 'ok',
            };
        });
    }
    getConnection(sourceOptions, _options) {
        return __awaiter(this, void 0, void 0, function* () {
            const privateKey = JSON.parse(sourceOptions['private_key']);
            const storage = new storage_1.Storage({
                projectId: privateKey['project_id'],
                credentials: {
                    client_email: privateKey['client_email'],
                    private_key: privateKey['private_key'],
                },
            });
            return storage;
        });
    }
}
exports.default = GcsQueryService;
//# sourceMappingURL=gcs.js.map