import { CollectionOperation, ObjectsOperation, QueryOptions } from './types';

export async function getSchema(queryOptions: QueryOptions, BASE_URL, headers) {
  if (queryOptions.consistency) {
    headers.consistency = queryOptions.consistency;
  }
  try {
    const response = await fetch(`${BASE_URL}/v1/schema`, {
      method: 'GET',
      headers: headers,
    });
    if (!response.ok) {
      throw new Error(`HTTP error in fetching schema! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    return error;
  }
}

export async function collectionOperation(queryOptions: QueryOptions, BASE_URL, headers) {
  const SCHEMA_URL = `${BASE_URL}/v1/schema`;
  switch (queryOptions.operation_collection) {
    case CollectionOperation.get_collection: {
      return await getCollection(queryOptions.collectionName, queryOptions.consistency, SCHEMA_URL, headers);
    }
    case CollectionOperation.create_collection: {
      return await createCollection(queryOptions, SCHEMA_URL, headers);
    }
    case CollectionOperation.delete_collection: {
      return await deleteCollection(queryOptions.collectionName, SCHEMA_URL, headers);
    }
  }
}

export async function getCollection(collectionName: string, consistency: boolean, SCHEMA_URL, headers) {
  try {
    if (consistency) {
      headers.consistency = consistency;
    }
    const response = await fetch(`${SCHEMA_URL}/${collectionName}`, {
      method: 'GET',
      headers: headers,
    });
    if (!response.ok) {
      throw new Error(`HTTP error in getting collection! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    return error;
  }
}

export async function createCollection(queryOptions: QueryOptions, SCHEMA_URL, headers) {
  const collectionConfig = {
    class: queryOptions.collectionName,
    vectorizer: queryOptions.vectorizer,
    vectorIndexType: queryOptions.vector_index_type,
    vectorIndexConfig: JSON.parse(queryOptions.vector_index_config),
    shardingConfig: JSON.parse(queryOptions.sharding_config),
    replicationConfig: {
      factor: Number(queryOptions.factor),
      asyncEnabled: Boolean(queryOptions.async_enabled),
      deletionStrategy: queryOptions.deletion_strategy,
    },
    invertedIndexConfig: {
      cleanupIntervalSeconds: Number(queryOptions.clean_up_interval_seconds),
      bm25: JSON.parse(queryOptions.bm_25),
      stopwords: JSON.parse(queryOptions.stop_words),
      indexTimestamps: Boolean(queryOptions.index_time_stamps),
      indexNullState: Boolean(queryOptions.index_null_state),
      indexPropertyLength: Boolean(queryOptions.index_property_length),
    },
    moduleConfig: JSON.parse(queryOptions.module_config),
    description: queryOptions.description,
    properties: JSON.parse(queryOptions.properties),
  };

  try {
    const response = await fetch(SCHEMA_URL, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(collectionConfig),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    return error;
  }
}

export async function deleteCollection(collectionName: string, SCHEMA_URL, headers) {
  try {
    const response = await fetch(`${SCHEMA_URL}/${collectionName}`, {
      method: 'DELETE',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    return error;
  }
}

export async function objectsOperation(queryOptions: QueryOptions, BASE_URL, headers) {
  const OBJECT_URL = `${BASE_URL}/v1/objects`;
  switch (queryOptions.operation_objects) {
    case ObjectsOperation.create_object: {
      return await createObject(queryOptions, OBJECT_URL, headers);
    }
    case ObjectsOperation.get_object_by_id: {
      return await getObjectById(queryOptions, OBJECT_URL, headers);
    }
    case ObjectsOperation.list_objects: {
      return await listObjects(queryOptions, OBJECT_URL, headers);
    }
    case ObjectsOperation.delete_object_by_id: {
      return await deleteObjectById(queryOptions, OBJECT_URL, headers);
    }
  }
}

export async function listObjects(queryOptions: QueryOptions, OBJECT_URL, headers) {
  if (!queryOptions.collectionName) throw new Error('Collection name is required');
  const params = new URLSearchParams();
  params.append('class', queryOptions.collectionName);
  const paramMapping = {
    include_vectors: (val: string) => val === 'true' || JSON.parse(val),
    after: String,
    offset: Number,
    limit: Number,
    include: (val: string) => val.split(','),
    sort: (val: string) => val.split(','),
    order: (val: string) => val.split(','),
    tenant: String,
  };
  try {
    Object.entries(paramMapping).forEach(([key, converter]) => {
      if (queryOptions[key] && queryOptions[key] !== '{}' && queryOptions[key] !== '') {
        const value = converter(queryOptions[key]);
        if (value) params.append(key, String(value));
      }
    });
    const response = await fetch(`${OBJECT_URL}?${params.toString()}`, {
      method: 'GET',
      headers: headers,
    });
    if (!response.ok) {
      throw new Error(`HTTP error in listing objects! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    return error;
  }
}

export async function createObject(queryOptions: QueryOptions, OBJECT_URL, headers) {
  try {
    const requestBody = {
      class: queryOptions.collectionName_create_object,
      properties: JSON.parse(queryOptions.properties_create_object),
      id: queryOptions.object_uuid,
    };

    if (queryOptions.vectors_create_object) {
      if (Array.isArray(queryOptions.vectors_create_object)) {
        requestBody['vector'] = queryOptions.vectors_create_object;
      } else {
        requestBody['vectors'] = queryOptions.vectors_create_object;
      }
    }

    const response = await fetch(`${OBJECT_URL}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    return error;
  }
}

export async function getObjectById(queryOptions: QueryOptions, OBJECT_URL, headers) {
  const { collectionName_get_object: collection, objectId_get_object: uuid } = queryOptions;
  try {
    const response = await fetch(`${OBJECT_URL}/${collection}/${uuid}`, {
      method: 'GET',
      headers: headers,
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    return error;
  }
}

export async function deleteObjectById(queryOptions: QueryOptions, OBJECT_URL, headers) {
  const { collectionName_delete_object: collection, objectId_delete_object: uuid } = queryOptions;
  try {
    const response = await fetch(`${OBJECT_URL}/${collection}/${uuid}`, {
      method: 'DELETE',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    return error;
  }
}
