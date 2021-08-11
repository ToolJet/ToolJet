
export async function queryCollection(db, collection: string): Promise<object> { 

  const snapshot = await db.collection(collection).get();

  let data = [];
  snapshot.forEach((doc) => {
   data.push({
     document_id: doc.id,
     data: doc.data()
   })
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

export async function bulkUpdate(db, collection: string, records: Array<object>,  documentIdKey: string): Promise<object> { 

  for(const record of records) { 
    const path = `${collection}/${record[documentIdKey]}`;
    updateDocument(db, path, JSON.stringify(record));
  }

  return {};
}
