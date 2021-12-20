"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.signedUrlForPut = exports.signedUrlForGet = exports.uploadFile = exports.getFile = exports.listFiles = exports.listBuckets = void 0;
const stream = __importStar(require("stream"));
function listBuckets(client, _options) {
    return __awaiter(this, void 0, void 0, function* () {
        const [buckets, ,] = yield client.getBuckets({
            autoPaginate: false,
        });
        return { buckets: buckets.map((bucket) => bucket.name) };
    });
}
exports.listBuckets = listBuckets;
function listFiles(client, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const [, , metadata] = yield client
            .bucket(options['bucket'])
            .getFiles({ prefix: options['prefix'], autoPaginate: false });
        return { files: metadata.items };
    });
}
exports.listFiles = listFiles;
function getFile(client, options) {
    return __awaiter(this, void 0, void 0, function* () {
        // Create a helper function to convert a ReadableStream to a string.
        const streamToString = (stream) => new Promise((resolve, reject) => {
            const chunks = [];
            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('error', reject);
            stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
        });
        const data = client.bucket(options['bucket']).file(options['file']).createReadStream();
        // Convert the ReadableStream to a string.
        const bodyContents = yield streamToString(data);
        return Object.assign(Object.assign({}, data), { Body: bodyContents });
    });
}
exports.getFile = getFile;
function uploadFile(client, options) {
    return __awaiter(this, void 0, void 0, function* () {
        // Get a reference to the bucket
        const myBucket = client.bucket(options['bucket']);
        // Create a reference to a file object
        const file = myBucket.file(options['file']);
        // Create a pass through stream from a string
        const passthroughStream = new stream.PassThrough();
        passthroughStream.write(options['data']);
        passthroughStream.end();
        passthroughStream.pipe(file.createWriteStream({
            metadata: { contentType: options['contentType'] },
        }));
        return { success: true };
    });
}
exports.uploadFile = uploadFile;
function signedUrlForGet(client, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const defaultExpiry = Date.now() + 15 * 60 * 1000; // 15 mins
        const expiresIn = options['expiresIn'] ? Date.now() + options['expiresIn'] * 1000 : defaultExpiry;
        const [url] = yield client.bucket(options['bucket']).file(options['file']).getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: expiresIn,
        });
        return { url };
    });
}
exports.signedUrlForGet = signedUrlForGet;
function signedUrlForPut(client, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const defaultExpiry = Date.now() + 15 * 60 * 1000; // 15 mins
        const expiresIn = options['expiresIn'] ? Date.now() + options['expiresIn'] * 1000 : defaultExpiry;
        const [url] = yield client
            .bucket(options['bucket'])
            .file(options['file'])
            .getSignedUrl(Object.assign({ version: 'v4', action: 'write', expires: expiresIn }, (options['contentType'] && { contentType: options['contentType'] })));
        return { url };
    });
}
exports.signedUrlForPut = signedUrlForPut;
//# sourceMappingURL=operations.js.map