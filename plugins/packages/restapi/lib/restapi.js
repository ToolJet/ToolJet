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
const urrl = require('url');
const got = require('got');
function isEmpty(value) {
    return value === undefined || value === null || value === NaN || (typeof value === 'object' && Object.keys(value).length === 0) || (typeof value === 'string' && value.trim().length === 0);
}
class RestapiQueryService {
    /* Headers of the source will be overridden by headers of the query */
    headers(sourceOptions, queryOptions, hasDataSource) {
        const _headers = (queryOptions.headers || []).filter((o) => {
            return o.some((e) => !isEmpty(e));
        });
        if (!hasDataSource)
            return Object.fromEntries(_headers);
        const headerData = _headers.concat(sourceOptions.headers || []);
        const headers = Object.fromEntries(headerData);
        Object.keys(headers).forEach((key) => (headers[key] === '' ? delete headers[key] : {}));
        return headers;
    }
    /* Body params of the source will be overridden by body params of the query */
    body(sourceOptions, queryOptions, hasDataSource) {
        const _body = (queryOptions.body || []).filter((o) => {
            return o.some((e) => !isEmpty(e));
        });
        if (!hasDataSource)
            return Object.fromEntries(_body);
        const bodyParams = _body.concat(sourceOptions.body || []);
        return Object.fromEntries(bodyParams);
    }
    /* Search params of the source will be overridden by Search params of the query */
    searchParams(sourceOptions, queryOptions, hasDataSource) {
        const _urlParams = (queryOptions.url_params || []).filter((o) => {
            return o.some((e) => !isEmpty(e));
        });
        if (!hasDataSource)
            return Object.fromEntries(_urlParams);
        const urlParams = _urlParams.concat(sourceOptions.url_params || []);
        return Object.fromEntries(urlParams);
    }
    run(sourceOptions, queryOptions, dataSourceId) {
        return __awaiter(this, void 0, void 0, function* () {
            /* REST API queries can be adhoc or associated with a REST API datasource */
            const hasDataSource = dataSourceId !== undefined;
            const requiresOauth = sourceOptions['auth_type'] === 'oauth2';
            const headers = this.headers(sourceOptions, queryOptions, hasDataSource);
            /* Chceck if OAuth tokens exists for the source if query requires OAuth */
            if (requiresOauth) {
                const tokenData = sourceOptions['tokenData'];
                if (!tokenData) {
                    const tooljetHost = process.env.TOOLJET_HOST;
                    const authUrl = `${sourceOptions['auth_url']}?response_type=code&client_id=${sourceOptions['client_id']}&redirect_uri=${tooljetHost}/oauth2/authorize&scope=${sourceOptions['scopes']}`;
                    return {
                        status: 'needs_oauth',
                        data: { auth_url: authUrl },
                    };
                }
                else {
                    const accessToken = tokenData['access_token'];
                    if (sourceOptions['add_token_to'] === 'header') {
                        const headerPrefix = sourceOptions['header_prefix'];
                        headers['Authorization'] = `${headerPrefix}${accessToken}`;
                    }
                }
            }
            let result = {};
            /* Prefixing the base url of datasouce if datasource exists */
            const url = hasDataSource ? `${sourceOptions.url}${queryOptions.url || ''}` : queryOptions.url;
            const method = queryOptions['method'];
            const json = method !== 'get' ? this.body(sourceOptions, queryOptions, hasDataSource) : undefined;
            const paramsFromUrl = urrl.parse(url, true).query;
            try {
                const response = yield got(url, {
                    method,
                    headers,
                    searchParams: Object.assign(Object.assign({}, paramsFromUrl), this.searchParams(sourceOptions, queryOptions, hasDataSource)),
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
exports.default = RestapiQueryService;
//# sourceMappingURL=restapi.js.map