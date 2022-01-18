export class QueryError extends Error {
  data: {};
  description: any;
  constructor(message: string | undefined, description: any, data: {}) {
    super(message);
    this.name = this.constructor.name;
    this.data = data;
    this.description = description;

    console.log(this.description);
  }
}
