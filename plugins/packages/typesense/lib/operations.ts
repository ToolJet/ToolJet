const parse = (obj) => {
  return obj !== '' ? JSON.parse(obj) : {};
}

export async function createCollection(client, schema: string): Promise<object> {
  const result = await client.collections().create(parse(schema));
  return result;
}

export async function search(client, collection: string, searchParams: string): Promise<object> {
  const result = await client.collections(collection).documents().search(parse(searchParams));
  return result;
}

export async function indexDocument(client, collection: string, document: string): Promise<object> {
  const result = await client.collections(collection).documents().create(parse(document));
  return result;
}

export async function getDocument(client, collection: string, id: string): Promise<object> {
  const result = await client.collections(collection).documents(id).retrieve();
  return result;
}

export async function updateDocument(client, collection: string, id: string, document: string): Promise<object> {
  const result = await client.collections(collection).documents(id).update(parse(document));
  return result;
}

export async function deleteDocument(client, collection: string, id: string): Promise<object> {
  const result = await client.collections(collection).documents(id).delete();
  return result;
}
