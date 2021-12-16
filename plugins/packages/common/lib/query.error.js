export class QueryError extends Error {
  public data;
  public description;

  constructor(message, description, data) {
    super(message);
    this.name = this.constructor.name;
    this.data = data;
    this.description = description;

    console.log(this.description);
  }
}
