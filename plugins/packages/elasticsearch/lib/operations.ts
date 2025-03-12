export async function search(client, index: string, query: string, scroll?: string): Promise<object> {
  const searchParams: any = {
    index,
    body: JSON.parse(query),
  };

  if (scroll) {
    searchParams.scroll = scroll;
  }

  const result = await client.search(searchParams);

  return result;
}

export async function indexDocument(client, index: string, body: string): Promise<object> {
  const result = await client.index({
    index,
    body: JSON.parse(body),
  });

  return result;
}

export async function getDocument(client, index: string, id: string): Promise<object> {
  const result = await client.get({ index, id });

  return result;
}

export async function updateDocument(client, index: string, id: string, body: string): Promise<object> {
  const result = await client.update({
    index,
    id,
    body: JSON.parse(body),
  });
  return result;
}

export async function deleteDocument(client, index: string, id: string): Promise<object> {
  const result = await client.delete({ index, id });
  return result;
}

export async function bulkOperation(client, operations: string): Promise<object> {
  const result = await client.bulk({
    body: JSON.parse(operations),
  });
  return result;
}

export async function countDocuments(client, index: string, query?: string): Promise<object> {
  const body = query ? JSON.parse(query) : undefined;
  const result = await client.count({ index, body });
  return result;
}

export async function documentExists(client, index: string, id: string): Promise<boolean> {
  const result = await client.exists({ index, id });
  return result;
}

export async function multiGet(client, operations: string): Promise<object> {
  const result = await client.mget({
    body: JSON.parse(operations),
  });
  return result;
}

export async function scrollSearch(client, scrollId: string, scroll: string): Promise<object> {
  const result = await client.scroll({
    scroll_id: scrollId,
    scroll: scroll,
  });
  return result;
}

export async function clearScroll(client, scrollId: string): Promise<object> {
  const result = await client.clearScroll({
    scroll_id: scrollId,
  });
  return result;
}

export async function getCatIndices(client): Promise<object> {
  const result = await client.cat.indices({ format: 'json' });
  return result;
}

export async function getClusterHealth(client): Promise<object> {
  const result = await client.cluster.health();
  return result;
}
