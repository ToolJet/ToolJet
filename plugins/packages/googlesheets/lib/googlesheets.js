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
const operations_1 = require("./operations");
const got = require('got');
class GooglesheetsQueryService {
    authUrl() {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const tooljetHost = process.env.TOOLJET_HOST;
        return `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${tooljetHost}/oauth2/authorize`;
    }
    accessDetailsFrom(authCode) {
        return __awaiter(this, void 0, void 0, function* () {
            const accessTokenUrl = 'https://oauth2.googleapis.com/token';
            const clientId = process.env.GOOGLE_CLIENT_ID;
            const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
            const tooljetHost = process.env.TOOLJET_HOST;
            const redirectUri = `${tooljetHost}/oauth2/authorize`;
            const grantType = 'authorization_code';
            const customParams = { prompt: 'consent', access_type: 'offline' };
            const data = Object.assign({ code: authCode, client_id: clientId, client_secret: clientSecret, grant_type: grantType, redirect_uri: redirectUri }, customParams);
            const authDetails = [];
            try {
                const response = yield got(accessTokenUrl, {
                    method: 'post',
                    json: data,
                    headers: { 'Content-Type': 'application/json' },
                });
                const result = JSON.parse(response.body);
                if (response.statusCode !== 200) {
                    throw Error('could not connect to Googlesheets');
                }
                if (result['access_token']) {
                    authDetails.push(['access_token', result['access_token']]);
                }
                if (result['refresh_token']) {
                    authDetails.push(['refresh_token', result['refresh_token']]);
                }
            }
            catch (error) {
                console.log(error.response.body);
                throw Error('could not connect to Googlesheets');
            }
            return authDetails;
        });
    }
    authHeader(token) {
        return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    }
    run(sourceOptions, queryOptions, dataSourceId) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = {};
            let response = null;
            const operation = queryOptions.operation;
            const spreadsheetId = queryOptions['spreadsheet_id'];
            const spreadsheetRange = queryOptions['spreadsheet_range'] ? queryOptions['spreadsheet_range'] : 'A1:Z500';
            const accessToken = sourceOptions['access_token'];
            const queryOptionFilter = { key: queryOptions['where_field'], value: queryOptions['where_value'] };
            try {
                switch (operation) {
                    case 'info':
                        response = yield got(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
                            method: 'get',
                            headers: this.authHeader(accessToken),
                        });
                        result = JSON.parse(response.body);
                        break;
                    case 'read':
                        result = yield (0, operations_1.readData)(spreadsheetId, spreadsheetRange, queryOptions['sheet'], this.authHeader(accessToken));
                        break;
                    case 'append':
                        result = yield (0, operations_1.appendData)(spreadsheetId, queryOptions['sheet'], queryOptions['rows'], this.authHeader(accessToken));
                        break;
                    case 'update':
                        result = yield (0, operations_1.batchUpdateToSheet)(spreadsheetId, queryOptions['body'], queryOptionFilter, queryOptions['where_operation'], this.authHeader(accessToken));
                        break;
                    case 'delete_row':
                        result = yield (0, operations_1.deleteData)(spreadsheetId, queryOptions['sheet'], queryOptions['row_index'], this.authHeader(accessToken));
                        break;
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
exports.default = GooglesheetsQueryService;
//# sourceMappingURL=googlesheets.js.map