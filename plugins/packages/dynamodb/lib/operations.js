"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanTable = exports.queryTable = exports.deleteItem = exports.getItem = exports.listTables = void 0;
function listTables(client) {
    return new Promise((resolve, reject) => {
        client.listTables(function (err, data) {
            if (err) {
                reject(err);
            }
            else {
                resolve(data['TableNames']);
            }
        });
    });
}
exports.listTables = listTables;
function getItem(client, table, key) {
    const params = {
        TableName: table,
        Key: key,
    };
    return new Promise((resolve, reject) => {
        client.get(params, function (err, data) {
            if (err) {
                reject(err);
            }
            else {
                resolve(data['Item'] || {});
            }
        });
    });
}
exports.getItem = getItem;
function deleteItem(client, table, key) {
    const params = {
        TableName: table,
        Key: key,
    };
    return new Promise((resolve, reject) => {
        client.delete(params, function (err, data) {
            if (err) {
                reject(err);
            }
            else {
                resolve(data);
            }
        });
    });
}
exports.deleteItem = deleteItem;
function queryTable(client, queryCondition) {
    return new Promise((resolve, reject) => {
        client.query(queryCondition, function (err, data) {
            if (err) {
                reject(err);
            }
            else {
                resolve(data);
            }
        });
    });
}
exports.queryTable = queryTable;
function scanTable(client, scanCondition) {
    return new Promise((resolve, reject) => {
        client.scan(scanCondition, function (err, data) {
            if (err) {
                reject(err);
            }
            else {
                resolve(data);
            }
        });
    });
}
exports.scanTable = scanTable;
//# sourceMappingURL=operations.js.map