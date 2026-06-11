import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { decode } from 'js-base64';
import allPlugins from '@tooljet/plugins/dist/server';
import { PluginsRepository } from '@modules/plugins/repository';
import { TooljetDbDataOperationsService } from '@modules/tooljet-db/services/tooljet-db-data-operations.service';
import { runInNewContext, createContext } from 'vm';

@Injectable()
export class PluginsServiceSelector {
  protected readonly plugins: any = {};
  protected static instance: PluginsServiceSelector;

  constructor(
    protected pluginsRepository: PluginsRepository,
    protected tooljetDbDataOperationsService: TooljetDbDataOperationsService
  ) {
    if (PluginsServiceSelector.instance) {
      return PluginsServiceSelector.instance;
    }

    PluginsServiceSelector.instance = this;
    return PluginsServiceSelector.instance;
  }

  async getService(pluginId: string, kind: string) {
    const isToolJetDatabaseKind = kind === 'tooljetdb';
    const isMarketplacePlugin = !!pluginId;

    try {
      if (isToolJetDatabaseKind) return this.tooljetDbDataOperationsService;
      if (isMarketplacePlugin) return await this.findMarketplacePluginService(pluginId);

      return new allPlugins[kind]();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  protected async findMarketplacePluginService(pluginId: string) {
    const isMarketplaceDev = process.env.ENABLE_MARKETPLACE_DEV_MODE === 'true';
    let decoded: string;

    if (!isMarketplaceDev && this.plugins[pluginId]) {
      decoded = this.plugins[pluginId];
    } else {
      const plugin = await this.pluginsRepository.findById(pluginId, ['indexFile']);
      decoded = decode(plugin.indexFile.data.toString());
      this.plugins[pluginId] = decoded;
    }

    interface PluginModule {
      default: new () => any;
      [key: string]: any;
    }

    // Create a module context with CommonJS support
    const moduleWrapper = {
      exports: {} as PluginModule,
    };

    const sandbox = createContext({
      // Spread global first to get most built-ins
      ...global,

      // Core Node.js APIs
      module: moduleWrapper,
      exports: moduleWrapper.exports,
      require: require,
      process: process,
      console: console,
      Buffer: Buffer,

      // Timers
      setTimeout: setTimeout,
      clearTimeout: clearTimeout,
      setInterval: setInterval,
      clearInterval: clearInterval,
      setImmediate: setImmediate,
      clearImmediate: clearImmediate,

      // Text encoding
      TextEncoder: TextEncoder,
      TextDecoder: TextDecoder,
      atob: globalThis.atob,
      btoa: globalThis.btoa,

      // URL APIs
      URL: URL,
      URLSearchParams: URLSearchParams,

      // Fetch API (Node.js 18+)
      fetch: globalThis.fetch,
      Headers: globalThis.Headers,
      Request: globalThis.Request,
      Response: globalThis.Response,
      FormData: globalThis.FormData,

      // Crypto
      crypto: globalThis.crypto,

      // Streams
      ReadableStream: globalThis.ReadableStream,
      WritableStream: globalThis.WritableStream,
      TransformStream: globalThis.TransformStream,

      // Performance
      performance: globalThis.performance,

      // Web APIs
      Event: globalThis.Event,
      EventTarget: globalThis.EventTarget,
      AbortController: globalThis.AbortController,
      AbortSignal: globalThis.AbortSignal,

      // Blob and File APIs
      Blob: globalThis.Blob,
      File: globalThis.File,

      // Structured clone
      structuredClone: globalThis.structuredClone,

      // WebAssembly
      WebAssembly: globalThis.WebAssembly,

      // Internationalization
      Intl: Intl,

      // Promises
      Promise: Promise,

      // Typed Arrays
      ArrayBuffer: ArrayBuffer,
      SharedArrayBuffer: SharedArrayBuffer,
      Int8Array: Int8Array,
      Uint8Array: Uint8Array,
      Uint8ClampedArray: Uint8ClampedArray,
      Int16Array: Int16Array,
      Uint16Array: Uint16Array,
      Int32Array: Int32Array,
      Uint32Array: Uint32Array,
      Float32Array: Float32Array,
      Float64Array: Float64Array,
      BigInt64Array: BigInt64Array,
      BigUint64Array: BigUint64Array,
      DataView: DataView,

      // Collections
      Map: Map,
      Set: Set,
      WeakMap: WeakMap,
      WeakSet: WeakSet,

      // Errors
      Error: Error,
      EvalError: EvalError,
      RangeError: RangeError,
      ReferenceError: ReferenceError,
      SyntaxError: SyntaxError,
      TypeError: TypeError,
      URIError: URIError,

      // JSON
      JSON: JSON,

      // Math
      Math: Math,

      // Reflection
      Reflect: Reflect,
      Proxy: Proxy,

      // Special values
      NaN: NaN,
      Infinity: Infinity,
      undefined: undefined,

      // Global functions
      parseInt: parseInt,
      parseFloat: parseFloat,
      isNaN: isNaN,
      isFinite: isFinite,
      decodeURI: decodeURI,
      decodeURIComponent: decodeURIComponent,
      encodeURI: encodeURI,
      encodeURIComponent: encodeURIComponent,

      // CommonJS specific
      __dirname: process.cwd(),
      __filename: __filename || '',
      global: global,
    });

    // Execute the plugin code
    runInNewContext(decoded, sandbox);

    // Get the exported service
    const service = new sandbox.module.exports.default();

    return service;
  }
}
