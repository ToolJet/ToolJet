export type Region = 'default' | 'us' | 'eu' | 'in';

export type SourceOptions = {
  api_key: string;
  /** Data residency region; selects the API host. Absent on data sources saved before it existed. */
  region?: Region;
};

/** The subset of an OpenAPI schema the request builder reads. Specs are dereferenced by the endpoint picker. */
export type SchemaObject = {
  type?: string;
  format?: string;
  contentMediaType?: string;
  properties?: Record<string, SchemaObject>;
  items?: SchemaObject;
  allOf?: SchemaObject[];
  oneOf?: SchemaObject[];
  anyOf?: SchemaObject[];
};

export type SelectedOperation = {
  requestBody?: {
    content?: Record<string, { schema?: SchemaObject }>;
  };
};

export type QueryOptions = {
  /** HTTP method, lowercased by the endpoint picker (get/post/put/patch/delete). */
  operation: string;
  /** Templated path straight out of the spec, e.g. /v1/text-to-speech/{voice_id}. */
  path: string;
  params?: {
    path?: Record<string, unknown>;
    query?: Record<string, unknown>;
    request?: Record<string, unknown>;
  };
  /** The spec's operation object, saved by the endpoint picker. */
  selectedOperation?: SelectedOperation;
};

/** A file as exposed by the File Picker component (`components.filepicker1.files[0]`). */
export type FileObject = {
  name?: string;
  type?: string;
  base64Data: string;
};

/** What a binary response (audio, video, zip) is returned as, so components can play or download it. */
export type BinaryResult = {
  mimeType: string;
  base64: string;
  dataUrl: string;
  size: number;
  fileName?: string;
  headers?: Record<string, string>;
};
