export class QueryError extends Error {
  data: Record<string, unknown>;
  description: any;
  metadata?: unknown;
  constructor(message: string | undefined, description: string, data: Record<string, unknown>, metadata?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.data = data;
    this.description = description;
    this.metadata = metadata;

    console.log(this.description);
  }
}

export class OAuthUnauthorizedClientError extends Error {
  data: Record<string, unknown>;
  description: any;
  constructor(message: string | undefined, description: any, data: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.data = data;
    this.description = description;

    console.log(this.description);
  }
}
