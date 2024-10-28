import { QueryOptions, Vector, SparseValues } from './types';
import { Pinecone } from '@pinecone-database/pinecone';  


// Function to get index stats
export async function getIndexStats(
  pinecone: Pinecone,
  options: QueryOptions
): Promise<any> {
  const { index } = options;

  if (!index) {
    throw new Error('Index name is required');
  }

  try {
    const indexClient = pinecone.Index(index);
    const stats = await indexClient.describeIndexStats(); 
    
    return stats;
  } catch (error) {
    console.error('Error fetching index stats:', error);
    throw new Error(error?.message || 'An unexpected error occurred');
  }
}

// Function to list vector IDs (using listPaginated)
export async function listVectorIds(
  pinecone: Pinecone,
  options: QueryOptions
): Promise<any> {
  const { index, prefix, limit, paginationToken, namespace } = options;

  if (!index) {
    throw new Error('Index name is required');
  }

  try {
    const indexClient = pinecone.index(index);
    
    const listOptions = {
      prefix: prefix,
      limit: limit || 10,
      paginationToken: paginationToken,
    };

    const targetIndexClient = namespace 
      ? indexClient.namespace(namespace)
      : indexClient;

    const vectors = await targetIndexClient.listPaginated(listOptions);

    return vectors;
  } catch (error) {
    console.error('Error listing vector IDs:', error);
    throw new Error(error?.message || 'An unexpected error occurred');
  }
}

// Function to fetch vectors
export async function fetchVectors(
  pinecone: Pinecone,
  options: QueryOptions
): Promise<any> {
  const { index, ids, namespace } = options;

  // Log at the beginning to check if the function is called
  console.log('fetchVectors function called');

  if (!index || !ids) {
    throw new Error('Index name and vector IDs are required');
  }

  // Log the ids to check if they are being passed correctly
  console.log('Fetching vectors for IDs:', ids);

  try {
    const indexClient = pinecone.index(index); 
    
    const targetIndexClient = namespace 
      ? indexClient.namespace(namespace)
      : indexClient;

    
    const vectors = await targetIndexClient.fetch(ids);

    // Log the result from Pinecone
    console.log('Fetched vectors:', vectors);
    
    return vectors;  // Return the fetched vectors
  } catch (error) {
    // Log any errors that occur during fetch
    console.error('Error fetching vectors:', error);
    throw new Error(error?.message || 'An unexpected error occurred');
  }
}

export async function upsertVectors(
  pinecone: Pinecone,
  options: QueryOptions
): Promise<any> {
  const { index, vectors, namespace } = options;

  if (!index || !vectors) {
    throw new Error('Index name and vectors are required');
  }

  // Ensure that each vector has an ID and values array
  vectors.forEach((vector) => {
    if (!vector.id || !Array.isArray(vector.values)) {
      throw new Error('Each vector must have an id and a values array');
    }
  });

  try {
    const indexClient = pinecone.index(index);

    const targetIndexClient = namespace 
      ? indexClient.namespace(namespace)
      : indexClient;

    const upsertResponse = await targetIndexClient.upsert(vectors); 

    return upsertResponse;
  } catch (error) {
    console.error('Error upserting vectors:', error);
    throw new Error(error?.message || 'An unexpected error occurred');
  }
}

// Function to update a vector
export async function updateVector(
  pinecone: Pinecone,
  options: QueryOptions
): Promise<any> {
  const { index, id, values, sparseValues, namespace, setmetadata } = options;  

  if (!index || !id || (!values && !sparseValues)) {
    throw new Error('Index name, vector ID, and either values or sparse vector are required');
  }
  if (typeof values === 'string') {
    options.values = JSON.parse(values);
  }
  console.log('Updating vector with ID:', id, 'and values:', options.values);
  try {
    const indexClient = pinecone.index(index); 
    const updateResponse = await indexClient.update({
      id,
      values: values || undefined,  
      sparseValues: sparseValues || undefined,  
      //setmetadata: setmetadata || undefined,  
    });

    return updateResponse;  
  } catch (error) {
    console.error('Error updating vector:', error);
    throw new Error(error?.message || 'An unexpected error occurred');
  }
}

// Function to delete vectors (consolidates deleteMany, deleteOne, and deleteAll)
export async function deleteVectors(
  pinecone: Pinecone,
  options: QueryOptions
): Promise<any> {
  const { index, ids, delete_all, namespace, filter } = options;

  if (!index) {
    throw new Error('Index name is required');
  }

  // Ensuring that filter is provided when namespace is used and ids are not specified
  /*if (namespace && !delete_all && (!ids || ids.length === 0) && (!filter || Object.keys(filter).length === 0)) {
    throw new Error('`filter` property cannot be empty for key namespace when no specific ids are provided');
  }*/

  try {
    const indexClient = pinecone.Index(index).namespace(namespace);
    const deleteResponse = await indexClient.deleteMany({
      ids: ids, 
      filter: filter || undefined, 
      deleteAll: delete_all 
  });

    return deleteResponse;  
  } catch (error) {
    console.error('Error deleting vectors:', error);
    throw new Error(error?.message || 'An unexpected error occurred');
  }
}
