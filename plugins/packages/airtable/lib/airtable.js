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
const got = require('got');
class AirtableQueryService {
    authHeader(token) {
        return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    }
    run(sourceOptions, queryOptions, dataSourceId) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = {};
            let response = null;
            const operation = queryOptions.operation;
            const baseId = queryOptions['base_id'];
            const tableName = queryOptions['table_name'];
            const accessToken = sourceOptions['api_key'];
            try {
                switch (operation) {
                    case 'list_records': {
                        const pageSize = queryOptions['page_size'];
                        const offset = queryOptions['offset'];
                        response = yield got(`https://api.airtable.com/v0/${baseId}/${tableName}/?pageSize=${pageSize || ''}&offset=${offset || ''}`, {
                            method: 'get',
                            headers: this.authHeader(accessToken),
                        });
                        result = JSON.parse(response.body);
                        break;
                    }
                    case 'retrieve_record': {
                        const recordId = queryOptions['record_id'];
                        response = yield got(`https://api.airtable.com/v0/${baseId}/${tableName}/${recordId}`, {
                            headers: this.authHeader(accessToken),
                        });
                        result = JSON.parse(response.body);
                        break;
                    }
                    case 'update_record': {
                        response = yield got(`https://api.airtable.com/v0/${baseId}/${tableName}`, {
                            method: 'patch',
                            headers: this.authHeader(accessToken),
                            json: {
                                records: [
                                    {
                                        id: queryOptions['record_id'],
                                        fields: JSON.parse(queryOptions['body']),
                                    },
                                ],
                            },
                        });
                        result = JSON.parse(response.body);
                        break;
                    }
                    case 'delete_record': {
                        const _recordId = queryOptions['record_id'];
                        response = yield got(`https://api.airtable.com/v0/${baseId}/${tableName}/${_recordId}`, {
                            method: 'delete',
                            headers: this.authHeader(accessToken),
                        });
                        result = JSON.parse(response.body);
                        break;
                    }
                }
            }
            catch (error) {
                console.log(error.response);
                throw new query_error_1.QueryError('Query could not be completed', error.message, {});
            }
            return {
                status: 'ok',
                data: result,
            };
        });
    }
}
exports.default = AirtableQueryService;
//# sourceMappingURL=airtable.js.map