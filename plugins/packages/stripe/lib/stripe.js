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
class StripeQueryService {
    authHeader(token) {
        return { Authorization: `Bearer ${token}` };
    }
    run(sourceOptions, queryOptions, dataSourceId) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = {};
            const operation = queryOptions.operation;
            const apiKey = sourceOptions['api_key'];
            const baseUrl = 'https://api.stripe.com';
            const path = queryOptions['path'];
            let url = `${baseUrl}${path}`;
            const pathParams = queryOptions['params']['path'];
            const queryParams = queryOptions['params']['query'];
            const bodyParams = queryOptions['params']['request'];
            // Replace path params of url
            for (const param of Object.keys(pathParams)) {
                url = url.replace(`{${param}}`, pathParams[param]);
            }
            let response = null;
            try {
                if (operation === 'get') {
                    response = yield got(url, {
                        method: operation,
                        headers: this.authHeader(apiKey),
                        searchParams: queryParams,
                    });
                }
                else {
                    response = yield got(url, {
                        method: operation,
                        headers: this.authHeader(apiKey),
                        json: bodyParams,
                        searchParams: queryParams,
                    });
                }
                result = JSON.parse(response.body);
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
}
exports.default = StripeQueryService;
//# sourceMappingURL=stripe.js.map