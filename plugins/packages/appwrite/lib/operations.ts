import { Database } from 'node-appwrite';

export async function queryCollection(
  db: Database,
  collection: string,
  limit: number,
  order_fields: string[],
  order_types: string[]
): Promise<object> {
  const limitProvided = isNaN(limit) !== true;
  return await db.listDocuments(collection, [], limitProvided ? limit : 25, 0, null, null, order_fields, order_types);
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
