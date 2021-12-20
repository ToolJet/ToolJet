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
const { MongoClient } = require('mongodb');
class MongodbService {
    run(sourceOptions, queryOptions, dataSourceId) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield this.getConnection(sourceOptions);
            let result = {};
            const operation = queryOptions.operation;
            try {
                switch (operation) {
                    case 'list_collections':
                        result = yield db.listCollections().toArray();
                        break;
                    case 'insert_one':
                        result = yield db.collection(queryOptions.collection).insertOne(JSON.parse(queryOptions.document));
                        break;
                    case 'insert_many':
                        result = yield db.collection(queryOptions.collection).insertMany(JSON.parse(queryOptions.documents));
                        break;
                }
            }
            catch (err) {
                console.log(err);
            }
            return {
                status: 'ok',
                data: result,
            };
        });
    }
    testConnection(sourceOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield this.getConnection(sourceOptions);
            yield db.listCollections().toArray();
            return {
                status: 'ok',
            };
        });
    }
    getConnection(sourceOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            let db = null;
            const connectionType = sourceOptions['connection_type'];
            if (connectionType === 'manual') {
                const database = sourceOptions.database;
                const host = sourceOptions.host;
                const port = sourceOptions.port;
                const username = sourceOptions.username;
                const password = sourceOptions.password;
                const needsAuthentication = username !== '' && password !== '';
                const uri = needsAuthentication
                    ? `mongodb://${username}:${password}@${host}:${port}`
                    : `mongodb://${host}:${port}`;
                const client = new MongoClient(uri, {
                    directConnection: true,
                });
                yield client.connect();
                db = client.db(database);
            }
            else {
                const connectionString = sourceOptions['connection_string'];
                const client = new MongoClient(connectionString, { useNewUrlParser: true, useUnifiedTopology: true });
                yield client.connect();
                db = client.db();
            }
            return db;
        });
    }
}
exports.default = MongodbService;
//# sourceMappingURL=mongo.js.map