import { Databases, Query } from 'node-appwrite';

function parseValue(value: string | object) {
  try {
    return JSON.parse(value as string);
  } catch (err) {
    return value;
  }
}

function computeValue(value: string) {
  const numConverted = Number.parseInt(value);
  return isNaN(numConverted) ? parseValue(value) : numConverted;
}

export async function queryCollection(
  db: any,
  databaseId: string,
  collection: string,
  limit: string,
  order_fields: string | string[],
  order_types: string | string[],
  where_field: string,
  where_operation: string,
  where_value: any
): Promise<object> {
  const limitProvided = isNaN(Number.parseInt(limit));
  let queryString: string;
  if (where_field || where_operation || where_value) {
    let filterErrorStr: string | string[] = [];
    if (!where_field) filterErrorStr.push('Field');
    if (!where_operation) filterErrorStr.push('Operator');
    if (!where_value) filterErrorStr.push('Value');
    if (filterErrorStr.length) {
      const suffix = ` ${filterErrorStr.length > 1 ? 'fields are' : 'field is'} required`;
      filterErrorStr = filterErrorStr.join(' & ');
      filterErrorStr += suffix;
      throw new Error(filterErrorStr);
    }
    where_value = computeValue(where_value);

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
      case 'equal':
        queryString = Query.equal(where_field, where_value);
        break;
      case 'notEqual':
        queryString = Query.notEqual(where_field, where_value);
        break;
      case 'is':
        if (String(where_value).toLowerCase() === 'not null') {
          queryString = Query.isNotNull(where_field);
        } else if (String(where_value).toLowerCase() === 'null') {
          queryString = Query.isNull(where_field);
        }
        break;
      case 'startsWith':
        queryString = Query.startsWith(where_field, where_value);
        break;
      case 'endsWith':
        queryString = Query.endsWith(where_field, where_value);
        break;
      case 'search':
        queryString = Query.search(where_field, where_value);
        break;
      default:
        break;
    }
  }

  const queries = [Query.limit(!limitProvided ? Number(limit) : 25)];
  if (queryString !== '') {
    queries.push(queryString);
  }

  if (order_fields || order_types) {
    if (!order_fields) throw new Error('Order fields field is required.');
    if (!order_types) throw new Error('Order types field is required.');
    order_fields = parseValue(order_fields);
    order_types = parseValue(order_types);
    if (typeof order_fields === 'string' || typeof order_types === 'string') {
      throw new Error('Stringify order fields & order types values if not passing as {{["VALUE"]}}');
    }
    if (order_types.length !== order_fields.length) {
      throw new Error('Size of order types & order fields should be same');
    }

    for (let loop = 0; loop < order_fields.length; loop++) {
      if (order_types[loop].toLowerCase() === 'asc') {
        queries.push(Query.orderAsc(order_fields[loop]));
      }
      if (order_types[loop].toLowerCase() === 'desc') {
        queries.push(Query.orderDesc(order_fields[loop]));
      }
    }
  }

  return await db.listDocuments(databaseId, collection, queries);
}

export async function getDocument(
  db: Databases,
  databaseId: string,
  collectionId: string,
  documentId: string
): Promise<object> {
  return await db.getDocument(databaseId, collectionId, documentId);
}

export async function createDocument(
  db: Databases,
  databaseId: string,
  collectionId: string,
  body: object
): Promise<object> {
  return await db.createDocument(databaseId, collectionId, 'unique()', body);
}

export async function updateDocument(
  db: Databases,
  databaseId: string,
  collectionId: string,
  documentId: string,
  body: object
): Promise<object> {
  return await db.updateDocument(databaseId, collectionId, documentId, body);
}

export async function deleteDocument(
  db: Databases,
  databaseId: string,
  collectionId: string,
  documentId: string
): Promise<object> {
  await db.deleteDocument(databaseId, collectionId, documentId);
  return { deleted: true };
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
    await db.updateDocument(databaseId, collectionId, documentId, record);
  }

  return { message: 'Docs are being updated' };
}
