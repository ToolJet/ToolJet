import {Databases, Query} from 'node-appwrite';

function computeValue(value: string) {
    const numConverted = Number.parseInt(value);
    return isNaN(numConverted) ? value : numConverted;
}

export async function queryCollection(
    db: Databases,
    databaseId: string,
    collection: string,
    limit: number,
    order_fields: string[],
    order_types: string[],
    where_field: string,
    where_operation: string,
    where_value: any
): Promise<object> {
    const limitProvided     = isNaN(limit) !== true;
    let queryString: string = '';
    where_value             = computeValue(where_value);

    switch (where_operation) {
        case '==':
            queryString = Query.equal(where_field, where_value);
            break;
        case '!=':
            queryString = Query.notEqual(where_field, where_value);
            break;
        case '<':
            queryString = Query.lessThan(where_field, where_value);
            break;
        case '>':
            queryString = Query.greaterThan(where_field, where_value);
            break;
        case '>=':
            queryString = Query.greaterThanEqual(where_field, where_value);
            break;
        case '<=':
            queryString = Query.lessThanEqual(where_field, where_value);
            break;
    }

    const queries = [
        Query.limit(limitProvided ? limit : 25),
    ];
    if (queryString !== '') {
        queries.push(queryString);
    }

    for (let loop = 0; loop < order_fields.length; loop++) {
        if (order_types[loop].toLowerCase() === 'asc') {
            queries.push(Query.orderAsc(order_fields[loop]))
        }
        if (order_types[loop].toLowerCase() === 'desc') {
            queries.push(Query.orderDesc(order_fields[loop]))
        }
    }

    return await db.listDocuments(
        databaseId,
        collection,
        queries,
    );
}

export async function getDocument(db: Databases, databaseId: string, collectionId: string, documentId: string): Promise<object> {
    return await db.getDocument(databaseId,collectionId, documentId);
}

export async function createDocument(db: Databases, databaseId: string, collectionId: string, body: object): Promise<object> {
    return await db.createDocument(databaseId,collectionId, 'unique()', body);
}

export async function updateDocument(
    db: Databases,
    databaseId: string,
    collectionId: string,
    documentId: string,
    body: object
): Promise<object> {
    return await db.updateDocument(databaseId,collectionId, documentId, body);
}

export async function deleteDocument(db: Databases, databaseId: string, collectionId: string, documentId: string): Promise<object> {
    return await db.deleteDocument(databaseId,collectionId, documentId);
}

export async function bulkUpdate(
    db: Databases,
    databaseId: string,
    collectionId: string,
    records: Array<object>,
    documentIdKey: string
): Promise<object> {
    for (const record of records) {
        const documentId = record[documentIdKey];
        await db.updateDocument(databaseId,collectionId, documentId, record);
    }

    return {message: 'Docs are being updated'};
}
