import { Database, Query } from 'node-appwrite';

function computeValue(value: string) {
  const numConverted = Number.parseInt(value);
  return isNaN(numConverted) ? value : numConverted;
}

export async function queryCollection(
  db: Database,
  collection: string,
  limit: number,
  order_fields: string[],
  order_types: string[],
  where_field: string,
  where_operation: string,
  where_value: any
): Promise<object> {
  const limitProvided = isNaN(limit) !== true;
  let queryString: string;
  where_value = computeValue(where_value);

  switch (where_operation) {
    case '==':
      queryString = Query.equal(where_field, where_value);
      break;
    case '!=':
      queryString = Query.notEqual(where_field, where_value);
      break;
    case '<':
      queryString = Query.lesser(where_field, where_value);
      break;
    case '>':
      queryString = Query.greater(where_field, where_value);
      break;
    case '>=':
      queryString = Query.greaterEqual(where_field, where_value);
      break;
    case '<=':
      queryString = Query.lesserEqual(where_field, where_value);
      break;
  }

  return await db.listDocuments(
    collection,
    queryString ? [queryString] : [],
    limitProvided ? limit : 25,
    0,
    null,
    null,
    order_fields,
    order_types
  );
}

export async function getDocument(db: Database, collectionId: string, documentId: string): Promise<object> {
  return await db.getDocument(collectionId, documentId);
}

export async function createDocument(db: Database, collectionId: string, body: object): Promise<object> {
  return await db.createDocument(collectionId, 'unique()', body);
}

export async function updateDocument(
  db: Database,
  collectionId: string,
  documentId: string,
  body: object
): Promise<object> {
  return await db.updateDocument(collectionId, documentId, body);
}

export async function deleteDocument(db: Database, collectionId: string, documentId: string): Promise<object> {
  return await db.deleteDocument(collectionId, documentId);
}

export async function bulkUpdate(
  db: Database,
  collectionId: string,
  records: Array<object>,
  documentIdKey: string
): Promise<object> {
  for (const record of records) {
    const documentId = record[documentIdKey];
    await db.updateDocument(collectionId, documentId, record);
  }

  return { message: 'Docs are being updated' };
}
