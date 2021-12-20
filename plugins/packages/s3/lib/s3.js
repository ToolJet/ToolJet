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
const client_s3_1 = require("@aws-sdk/client-s3");
const query_error_1 = require("common/lib/query.error");
class S3QueryService {
    run(sourceOptions, queryOptions, dataSourceId) {
        return __awaiter(this, void 0, void 0, function* () {
            const operation = queryOptions.operation;
            const client = yield this.getConnection(sourceOptions, { operation });
            let result = {};
            try {
                switch (operation) {
                    case 'list_buckets':
                        result = yield (0, operations_1.listBuckets)(client, {});
                        break;
                    case 'list_objects':
                        result = yield (0, operations_1.listObjects)(client, queryOptions);
                        break;
                    case 'get_object':
                        result = yield (0, operations_1.getObject)(client, queryOptions);
                        break;
                    case 'upload_object':
                        result = yield (0, operations_1.uploadObject)(client, queryOptions);
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
            const client = yield this.getConnection(sourceOptions, {
                operation: 'list_objects',
            });
            yield (0, operations_1.listBuckets)(client, {});
            return {
                status: 'ok',
            };
        });
    }
    getConnection(sourceOptions, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const credentials = {
                accessKeyId: sourceOptions['access_key'],
                secretAccessKey: sourceOptions['secret_key'],
            };
            return new client_s3_1.S3Client({ region: sourceOptions['region'], credentials });
        });
    }
}
exports.default = S3QueryService;
//# sourceMappingURL=s3.js.map