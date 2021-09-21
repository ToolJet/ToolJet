import { Firestore, Query } from "@google-cloud/firestore";

export async function queryCollection(
  db: Firestore,
  collection: string,
  limit: number,
  where_operation: any,
  where_field: string,
  where_value: any,
  order_field: string,
  order_type: any,
): Promise<object> {
  const limitProvided = isNaN(limit) !== true;
  const whereConditionProvided =
    ([undefined, ''].includes(where_field) === false) &&
    ([undefined, ''].includes(where_operation) === false) &&
    (where_value != undefined);
  const orderProvided = ([undefined, ''].includes(order_field) === false);

  const collectionRef = db.collection(collection);
  let query: Query = collectionRef;

  if (whereConditionProvided || limitProvided || orderProvided) {
    if (whereConditionProvided)
      query = query.where(where_field, where_operation, where_value);
    if (limitProvided)
      query = query.limit(limit);
    if (orderProvided)
      query = query.orderBy(order_field, order_type);
  }

  const snapshot = await query.get();

  const data = [];
  snapshot.forEach((doc) => {
    data.push({
      document_id: doc.id,
      data: doc.data(),
    });
  });

  return data;
}

export async function getDocument(db, path: string): Promise<object> {
  const docRef = db.doc(path);
  const doc = await docRef.get();
  // if (!doc.exists) {

  return doc.data();
}

export async function setDocument(db, path: string, body: string): Promise<object> {
  const docRef = db.doc(path);
  const result = await docRef.set(JSON.parse(body));

  return result;
}

export async function addDocument(db, path: string, body: string): Promise<object> {
  const docRef = db.doc(path);
  const result = await docRef.set(JSON.parse(body));

  return result;
}

export async function updateDocument(db, path: string, body: string): Promise<object> {
  const docRef = db.doc(path);
  const result = await docRef.update(JSON.parse(body));

  return result;
}

export async function deleteDocument(db, path: string): Promise<object> {
  const docRef = db.doc(path);
  const result = await docRef.delete();

  return result;
}

export async function bulkUpdate(
  db,
  collection: string,
  records: Array<object>,
  documentIdKey: string
): Promise<object> {
  for (const record of records) {
    const path = `${collection}/${record[documentIdKey]}`;
    updateDocument(db, path, JSON.stringify(record));
  }

  return {};
}
