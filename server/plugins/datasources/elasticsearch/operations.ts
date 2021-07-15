export async function search(client, index: string, query: string): Promise<object> {

  const result = await client.search({
    index,
    body: JSON.parse(query)
  })

  return result;
}


export async function indexDocument(client, index: string, body: string): Promise<object> {

  const result = await client.index({
    index,
    body: JSON.parse(body)
  })

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
    body: JSON.parse(body)
  })

  return result;
}
