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
class SlackQueryService {
    authUrl() {
        const clientId = process.env.SLACK_CLIENT_ID;
        const tooljetHost = process.env.TOOLJET_HOST;
        return `https://slack.com/oauth/v2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${tooljetHost}/oauth2/authorize`;
    }
    accessDetailsFrom(authCode) {
        return __awaiter(this, void 0, void 0, function* () {
            const accessTokenUrl = 'https://slack.com/api/oauth.v2.access';
            const clientId = process.env.SLACK_CLIENT_ID;
            const clientSecret = process.env.SLACK_CLIENT_SECRET;
            const tooljetHost = process.env.TOOLJET_HOST;
            const redirectUri = `${tooljetHost}/oauth2/authorize`;
            const body = `code=${authCode}&client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${redirectUri}`;
            const response = yield got(accessTokenUrl, {
                method: 'post',
                body,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });
            const result = JSON.parse(response.body);
            if (response.statusCode !== 200) {
                throw Error('could not connect to Slack');
            }
            const authDetails = [];
            if (result['access_token']) {
                authDetails.push(['access_token', result['access_token']]);
            }
            if (result['refresh_token']) {
                authDetails.push(['refresh_token', result['refresh_token']]);
            }
            return authDetails;
        });
    }
    authHeader(token) {
        return { Authorization: `Bearer ${token}` };
    }
    run(sourceOptions, queryOptions, dataSourceId) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = {};
            let response = null;
            const operation = queryOptions.operation;
            const accessToken = sourceOptions['access_token'];
            try {
                switch (operation) {
                    case 'list_users':
                        response = yield got('https://slack.com/api/users.list', {
                            method: 'get',
                            headers: this.authHeader(accessToken),
                        });
                        result = JSON.parse(response.body);
                        break;
                    case 'send_message': {
                        const body = {
                            channel: queryOptions['channel'],
                            text: queryOptions['message'],
                            as_user: queryOptions['sendAsUser'],
                        };
                        response = yield got('https://slack.com/api/chat.postMessage', {
                            method: 'post',
                            json: body,
                            headers: this.authHeader(accessToken),
                        });
                        result = JSON.parse(response.body);
                        break;
                    }
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
}
exports.default = SlackQueryService;
//# sourceMappingURL=slack.js.map