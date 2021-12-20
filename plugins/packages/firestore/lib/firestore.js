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
const query_error_1 = require("common/lib/query.error");
const operations_1 = require("./operations");
const { Firestore } = require('@google-cloud/firestore');
class FirestoreQueryService {
    run(sourceOptions, queryOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            const firestore = yield this.getConnection(sourceOptions);
            const operation = queryOptions.operation;
            let result = {};
            try {
                switch (operation) {
                    case 'query_collection':
                        result = yield (0, operations_1.queryCollection)(firestore, queryOptions.path, parseInt(queryOptions.limit), queryOptions.where_operation, queryOptions.where_field, queryOptions.where_value, queryOptions.order_field, queryOptions.order_type);
                        break;
                    case 'get_document':
                        result = yield (0, operations_1.getDocument)(firestore, queryOptions.path);
                        break;
                    case 'set_document':
                        result = yield (0, operations_1.setDocument)(firestore, queryOptions.path, queryOptions.body);
                        break;
                    case 'add_document':
                        result = yield (0, operations_1.addDocument)(firestore, queryOptions.path, queryOptions.body);
                        break;
                    case 'update_document':
                        result = yield (0, operations_1.updateDocument)(firestore, queryOptions.path, queryOptions.body);
                        break;
                    case 'delete_document':
                        result = yield (0, operations_1.deleteDocument)(firestore, queryOptions.path);
                        break;
                    case 'bulk_update':
                        result = yield (0, operations_1.bulkUpdate)(firestore, queryOptions.collection, JSON.parse(queryOptions.records), queryOptions['document_id_key']);
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
            yield (0, operations_1.getDocument)(client, 'test/test');
            return {
                status: 'ok',
            };
        });
    }
    getConnection(sourceOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            const gcpKey = (0, utils_helper_1.parseJson)(sourceOptions['gcp_key'], 'GCP key could not be parsed as a valid JSON object');
            const firestore = new Firestore({
                projectId: gcpKey['project_id'],
                credentials: {
                    private_key: gcpKey['private_key'],
                    client_email: gcpKey['client_email'],
                },
            });
            return firestore;
        });
    }
}
exports.default = FirestoreQueryService;
//# sourceMappingURL=firestore.js.map