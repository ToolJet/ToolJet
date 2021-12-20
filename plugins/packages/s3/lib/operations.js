"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signedUrlForPut = exports.uploadObject = exports.getObject = exports.signedUrlForGet = exports.listObjects = exports.listBuckets = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
// https://aws.amazon.com/blogs/developer/generate-presigned-url-modular-aws-sdk-javascript/
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
function listBuckets(client, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const command = new client_s3_1.ListBucketsCommand(options);
        return client.send(command);
    });
}
exports.listBuckets = listBuckets;
function listObjects(client, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const command = new client_s3_1.ListObjectsCommand({ Bucket: options['bucket'] });
        return client.send(command);
    });
}
exports.listObjects = listObjects;
function signedUrlForGet(client, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const command = new client_s3_1.GetObjectCommand({
            Bucket: options['bucket'],
            Key: options['key'],
        });
        const url = yield (0, s3_request_presigner_1.getSignedUrl)(client, command, {
            expiresIn: options['expiresIn'] || 3600,
        });
        return { url };
    });
}
exports.signedUrlForGet = signedUrlForGet;
function getObject(client, options) {
    return __awaiter(this, void 0, void 0, function* () {
        // Create a helper function to convert a ReadableStream to a string.
        const streamToString = (stream) => new Promise((resolve, reject) => {
            const chunks = [];
            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('error', reject);
            stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
        });
        // Get the object from the Amazon S3 bucket. It is returned as a ReadableStream.
        const command = new client_s3_1.GetObjectCommand({
            Bucket: options['bucket'],
            Key: options['key'],
        });
        const data = yield client.send(command);
        // Convert the ReadableStream to a string.
        const bodyContents = yield streamToString(data.Body);
        return Object.assign(Object.assign({}, data), { Body: bodyContents });
    });
}
exports.getObject = getObject;
function uploadObject(client, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const command = new client_s3_1.PutObjectCommand({
            Bucket: options['bucket'],
            Key: options['key'],
            Body: options['data'],
            ContentType: options['contentType'],
        });
        const data = yield client.send(command);
        return data;
    });
}
exports.uploadObject = uploadObject;
function signedUrlForPut(client, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const command = new client_s3_1.PutObjectCommand({
            Bucket: options['bucket'],
            Key: options['key'],
            ContentType: options['contentType'],
        });
        const url = yield (0, s3_request_presigner_1.getSignedUrl)(client, command, {
            expiresIn: options['expiresIn'] || 3600,
        });
        return { url };
    });
}
exports.signedUrlForPut = signedUrlForPut;
//# sourceMappingURL=operations.js.map