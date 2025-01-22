import weaviate, { WeaviateClient } from 'weaviate-client';


export async function getSchema(client: WeaviateClient,collectionName:string ) {
  try {
    let collection = client.collections.get(collectionName);
    const collectionDefinition = await collection.config.get();
    return collectionDefinition.properties;
  } catch (error) {
    console.error('Error fetching schema:', error);
    throw error;
  }
}


export async function listObjects(client: WeaviateClient) {
  try {
   const result=  await client.collections.listAll();
   return result;
   

  } catch (error) {
    console.log(error)
  }
  
}

export async function createObject(client:WeaviateClient, collectionName:string, properties: Record<string,any>) {
  try {
    const collection = client.collections.get(collectionName);
    if(!collection) return "Collection not found";

    const result =  await collection.data.insert({
      properties: properties,
      // vectors: Array(1536).fill(0.12345)
    });
    
    return result;

  } catch (error) {
    console.log(error);
    
  }
}

export async function getObjectById(client:WeaviateClient, collectionName:string, objectId:string) {
  try {
    const collection = client.collections.get(collectionName);
    if(!collection) return "Collection not exists";

   const result= await collection.query.fetchObjectById(objectId);
   return result;
   
    
  } catch (error) {
    console.error('Error fetching object by ID:', error);
    throw error;
  }
}

export async function deleteObjectById(client: WeaviateClient, collectionName: string, id:string) {
  try {
    const collectionToDelete = client.collections.get(collectionName)
    if(!collectionToDelete) return "Collection does not exists";
   
    return await collectionToDelete.data.deleteById(id)
  } catch (error) {
    console.error('Error deleting object:', error);
    throw error;
  }
}