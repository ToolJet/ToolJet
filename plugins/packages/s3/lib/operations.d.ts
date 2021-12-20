import { S3Client } from '@aws-sdk/client-s3';
export declare function listBuckets(client: S3Client, options: object): Promise<object>;
export declare function listObjects(client: S3Client, options: object): Promise<object>;
export declare function signedUrlForGet(client: S3Client, options: object): Promise<object>;
export declare function getObject(client: S3Client, options: object): Promise<object>;
export declare function uploadObject(client: S3Client, options: object): Promise<object>;
export declare function signedUrlForPut(client: S3Client, options: object): Promise<object>;
//# sourceMappingURL=operations.d.ts.map