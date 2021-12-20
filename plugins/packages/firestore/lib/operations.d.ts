import { Firestore } from '@google-cloud/firestore';
export declare function queryCollection(db: Firestore, collection: string, limit: number, where_operation: any, where_field: string, where_value: any, order_field: string, order_type: any): Promise<object>;
export declare function getDocument(db: any, path: string): Promise<object>;
export declare function setDocument(db: any, path: string, body: string): Promise<object>;
export declare function addDocument(db: any, path: string, body: string): Promise<object>;
export declare function updateDocument(db: any, path: string, body: string): Promise<object>;
export declare function deleteDocument(db: any, path: string): Promise<object>;
export declare function bulkUpdate(db: any, collection: string, records: Array<object>, documentIdKey: string): Promise<object>;
//# sourceMappingURL=operations.d.ts.map