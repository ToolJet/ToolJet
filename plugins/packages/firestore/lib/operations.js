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
exports.bulkUpdate = exports.deleteDocument = exports.updateDocument = exports.addDocument = exports.setDocument = exports.getDocument = exports.queryCollection = void 0;
function queryCollection(db, collection, limit, where_operation, where_field, where_value, order_field, order_type) {
    return __awaiter(this, void 0, void 0, function* () {
        const limitProvided = isNaN(limit) !== true;
        const whereConditionProvided = [undefined, ''].includes(where_field) === false &&
            [undefined, ''].includes(where_operation) === false &&
            where_value != undefined;
        const orderProvided = [undefined, ''].includes(order_field) === false;
        const collectionRef = db.collection(collection);
        let query = collectionRef;
        if (whereConditionProvided)
            query = query.where(where_field, where_operation, where_value);
        if (limitProvided)
            query = query.limit(limit);
        if (orderProvided)
            query = query.orderBy(order_field, order_type);
        const snapshot = yield query.get();
        const data = [];
        snapshot.forEach((doc) => {
            data.push({
                document_id: doc.id,
                data: doc.data(),
            });
        });
        return data;
    });
}
exports.queryCollection = queryCollection;
function getDocument(db, path) {
    return __awaiter(this, void 0, void 0, function* () {
        const docRef = db.doc(path);
        const doc = yield docRef.get();
        // if (!doc.exists) {
        return doc.data();
    });
}
exports.getDocument = getDocument;
function setDocument(db, path, body) {
    return __awaiter(this, void 0, void 0, function* () {
        const docRef = db.doc(path);
        const result = yield docRef.set(JSON.parse(body));
        return result;
    });
}
exports.setDocument = setDocument;
function addDocument(db, path, body) {
    return __awaiter(this, void 0, void 0, function* () {
        const docRef = db.doc(path);
        const result = yield docRef.set(JSON.parse(body));
        return result;
    });
}
exports.addDocument = addDocument;
function updateDocument(db, path, body) {
    return __awaiter(this, void 0, void 0, function* () {
        const docRef = db.doc(path);
        const result = yield docRef.update(JSON.parse(body));
        return result;
    });
}
exports.updateDocument = updateDocument;
function deleteDocument(db, path) {
    return __awaiter(this, void 0, void 0, function* () {
        const docRef = db.doc(path);
        const result = yield docRef.delete();
        return result;
    });
}
exports.deleteDocument = deleteDocument;
function bulkUpdate(db, collection, records, documentIdKey) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const record of records) {
            const path = `${collection}/${record[documentIdKey]}`;
            yield updateDocument(db, path, JSON.stringify(record));
        }
        return {};
    });
}
exports.bulkUpdate = bulkUpdate;
//# sourceMappingURL=operations.js.map