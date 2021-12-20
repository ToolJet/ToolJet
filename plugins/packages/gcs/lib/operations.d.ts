export declare function listBuckets(client: any, _options: any): Promise<{
    buckets: any;
}>;
export declare function listFiles(client: any, options: any): Promise<{
    files: any;
}>;
export declare function getFile(client: any, options: any): Promise<any>;
export declare function uploadFile(client: any, options: any): Promise<{
    success: boolean;
}>;
export declare function signedUrlForGet(client: any, options: any): Promise<{
    url: any;
}>;
export declare function signedUrlForPut(client: any, options: any): Promise<{
    url: any;
}>;
//# sourceMappingURL=operations.d.ts.map