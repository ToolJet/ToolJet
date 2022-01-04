export async function createCollection(client, schema: string): Promise<object> {
  try {
    const result = await client.collections().create(JSON.parse(schema));
    return result;
  } catch (exception) {
    return { error: exception.message, status: 'failed' };
  }
}

export async function search(client, collection: string, searchParams: string): Promise<object> {
  try {
    const result = await client.collections(collection).documents().search(JSON.parse(searchParams));
    return result;
  } catch (exception) {
    return { error: exception.message, status: 'failed' };
  }
}

export async function indexDocument(client, collection: string, document: string): Promise<object> {
  try {
    const result = await client.collections(collection).documents().create(JSON.parse(document));
    return result;
  } catch (exception) {
    return { error: exception.message, status: 'failed' };
  }
}

export async function getDocument(client, collection: string, id: string): Promise<object> {
  try {
    const result = await client.collections(collection).documents(id).retrieve();
    return result;
  } catch (exception) {
    return { error: exception.message, status: 'failed' };
  }
}

export async function updateDocument(client, collection: string, id: string, document: string): Promise<object> {
  try {
    const result = await client.collections(collection).documents(id).update(JSON.parse(document));
    return result;
  } catch (exception) {
    return { error: exception.message, status: 'failed' };
  }
}

export async function deleteDocument(client, collection: string, id: string): Promise<object> {
  try {
    const result = await client.collections(collection).documents(id).delete();
    return result;
  } catch (exception) {
    return { error: exception.message, status: 'failed' };
  }
}
