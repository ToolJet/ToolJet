var $3e5tj$commonqueryerror = require("common/query.error");
var $3e5tj$got = require("got");

function $parcel$defineInteropFlag(a) {
  Object.defineProperty(a, '__esModule', {value: true, configurable: true});
}
function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$defineInteropFlag(module.exports);

$parcel$export(module.exports, "default", () => $66f79438a786eaeb$export$2e2bcd8739ae039);
var $12bf592a60b669fe$exports = {};

$parcel$defineInteropFlag($12bf592a60b669fe$exports);

$parcel$export($12bf592a60b669fe$exports, "default", () => $12bf592a60b669fe$export$2e2bcd8739ae039);

var $12bf592a60b669fe$require$QueryError = $3e5tj$commonqueryerror.QueryError;

let $12bf592a60b669fe$var$AirtableQueryService = class AirtableQueryService {
    authHeader(token) {
        return {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }
    async run(sourceOptions, queryOptions, dataSourceId) {
        let result = {
        };
        let response = null;
        const operation = queryOptions.operation;
        const baseId = queryOptions['base_id'];
        const tableName = queryOptions['table_name'];
        const accessToken = sourceOptions['api_key'];
        try {
            switch(operation){
                case 'list_records':
                    {
                        const pageSize = queryOptions['page_size'];
                        const offset = queryOptions['offset'];
                        response = await $3e5tj$got(`https://api.airtable.com/v0/${baseId}/${tableName}/?pageSize=${pageSize || ''}&offset=${offset || ''}`, {
                            method: 'get',
                            headers: this.authHeader(accessToken)
                        });
                        result = JSON.parse(response.body);
                        break;
                    }
                case 'retrieve_record':
                    {
                        const recordId = queryOptions['record_id'];
                        response = await $3e5tj$got(`https://api.airtable.com/v0/${baseId}/${tableName}/${recordId}`, {
                            headers: this.authHeader(accessToken)
                        });
                        result = JSON.parse(response.body);
                        break;
                    }
                case 'update_record':
                    response = await $3e5tj$got(`https://api.airtable.com/v0/${baseId}/${tableName}`, {
                        method: 'patch',
                        headers: this.authHeader(accessToken),
                        json: {
                            records: [
                                {
                                    id: queryOptions['record_id'],
                                    fields: JSON.parse(queryOptions['body'])
                                }, 
                            ]
                        }
                    });
                    result = JSON.parse(response.body);
                    break;
                case 'delete_record':
                    {
                        const _recordId = queryOptions['record_id'];
                        response = await $3e5tj$got(`https://api.airtable.com/v0/${baseId}/${tableName}/${_recordId}`, {
                            method: 'delete',
                            headers: this.authHeader(accessToken)
                        });
                        result = JSON.parse(response.body);
                        break;
                    }
            }
        } catch (error) {
            console.log(error.response);
            throw new $12bf592a60b669fe$require$QueryError('Query could not be completed', error.message, {
            });
        }
        return {
            status: 'ok',
            data: result
        };
    }
};
var $12bf592a60b669fe$export$2e2bcd8739ae039 = $12bf592a60b669fe$var$AirtableQueryService;


var $66f79438a786eaeb$export$2e2bcd8739ae039 = {
    airtable: $12bf592a60b669fe$exports
};


//# sourceMappingURL=index.js.map
