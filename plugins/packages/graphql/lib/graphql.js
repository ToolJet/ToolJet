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
const got_1 = require("got");
const query_error_1 = require("common/lib/query.error");
const got = require('got');
class GraphqlQueryService {
    run(sourceOptions, queryOptions, dataSourceId) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = {};
            const url = sourceOptions.url;
            const query = queryOptions.query;
            const headers = Object.fromEntries(sourceOptions['headers']);
            const searchParams = Object.fromEntries(sourceOptions['url_params']);
            // Remove invalid headers from the headers object
            Object.keys(headers).forEach((key) => (headers[key] === '' ? delete headers[key] : {}));
            const json = {
                query,
            };
            try {
                const response = yield got(url, {
                    method: 'post',
                    headers,
                    searchParams,
                    json,
                });
                result = JSON.parse(response.body);
            }
            catch (error) {
                console.log(error);
                if (error instanceof got_1.HTTPError) {
                    result = {
                        code: error.code,
                    };
                }
                throw new query_error_1.QueryError('Query could not be completed', error.message, result);
            }
            return {
                status: 'ok',
                data: result,
            };
        });
    }
}
exports.default = GraphqlQueryService;
//# sourceMappingURL=graphql.js.map