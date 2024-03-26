export default class PostgrestQueryBuilder {
  public url: URLSearchParams;

  constructor() {
    this.url = new URLSearchParams();
  }

  order(column: string, value: string) {
    this.url.get('order')
      ? this.url.set('order', `${this.url.get('order')},${column}.${value}`)
      : this.url.append(`order`, `${column}.${value}`);
    return this;
  }

  not(column: string, value: string, operator = 'eq') {
    this.url.append(`${column}`, `not.${operator}.${value}`);
    return this;
  }

  or(filters: string, { foreignTable }: { foreignTable?: string } = {}) {
    const key = typeof foreignTable === 'undefined' ? 'or' : `${foreignTable}.or`;
    this.url.append(key, `(${filters})`);
    return this;
  }

  eq(column: string, value: string) {
    this.url.append(`${column}`, `eq.${value}`);
    return this;
  }

  neq(column: string, value: string) {
    this.url.append(`${column}`, `neq.${value}`);
    return this;
  }

  gt(column: string, value: string) {
    this.url.append(`${column}`, `gt.${value}`);
    return this;
  }

  gte(column: string, value: string) {
    this.url.append(`${column}`, `gte.${value}`);
    return this;
  }

  lt(column: string, value: string) {
    this.url.append(`${column}`, `lt.${value}`);
    return this;
  }

  lte(column: string, value: string) {
    this.url.append(`${column}`, `lte.${value}`);
    return this;
  }

  like(column: string, pattern: string) {
    this.url.append(`${column}`, `like.${pattern}`);
    return this;
  }

  ilike(column: string, pattern: string) {
    this.url.append(`${column}`, `ilike.${pattern}`);
    return this;
  }

  is(column: string, value: string) {
    if (value === 'notNull') {
      this.url.append(`${column}`, `not.is.null`);
    } else {
      this.url.append(`${column}`, `is.${value}`);
    }
    return this;
  }

  in(column: string, values: (string | number)[]) {
    const cleanedValues = values
      .map((s) => {
        if (typeof s === 'string' && new RegExp('[,()]').test(s)) return `"${s}"`;
        else return `${s}`;
      })
      .join(',');
    this.url.append(`${column}`, `in.(${cleanedValues})`);
    return this;
  }

  contains(column: string, value: string | string[] | Record<string, any>) {
    if (typeof value === 'string') {
      this.url.append(`${column}`, `cs.${value}`);
    } else if (Array.isArray(value)) {
      this.url.append(`${column}`, `cs.{${value.join(',')}}`);
    } else {
      this.url.append(`${column}`, `cs.${JSON.stringify(value)}`);
    }
    return this;
  }

  containedBy(column: string, value: string | string[] | Record<string, any>) {
    if (typeof value === 'string') {
      this.url.append(`${column}`, `cd.${value}`);
    } else if (Array.isArray(value)) {
      this.url.append(`${column}`, `cd.{${value.join(',')}}`);
    } else {
      this.url.append(`${column}`, `cd.${JSON.stringify(value)}`);
    }
    return this;
  }

  rangeLt(column: string, range: string) {
    this.url.append(`${column}`, `sl.${range}`);
    return this;
  }

  rangeGt(column: string, range: string) {
    this.url.append(`${column}`, `sr.${range}`);
    return this;
  }

  rangeGte(column: string, range: string) {
    this.url.append(`${column}`, `nxl.${range}`);
    return this;
  }

  rangeLte(column: string, range: string) {
    this.url.append(`${column}`, `nxr.${range}`);
    return this;
  }

  rangeAdjacent(column: string, range: string) {
    this.url.append(`${column}`, `adj.${range}`);
    return this;
  }

  overlaps(column: string, value: string | string[]) {
    if (typeof value === 'string') {
      this.url.append(`${column}`, `ov.${value}`);
    } else {
      this.url.append(`${column}`, `ov.{${value.join(',')}}`);
    }
    return this;
  }

  textSearch(column: string, query: string, { config, type = null }: { config?: string; type?: string } = {}) {
    let typePart = '';
    if (type === 'plain') {
      typePart = 'pl';
    } else if (type === 'phrase') {
      typePart = 'ph';
    } else if (type === 'websearch') {
      typePart = 'w';
    }
    const configPart = config === undefined ? '' : `(${config})`;
    this.url.append(`${column}`, `${typePart}fts${configPart}.${query}`);
    return this;
  }

  filter(column: string, operator: string, value: string) {
    this.url.append(`${column}`, `${operator}.${value}`);
    return this;
  }

  match(query: Record<string, string>) {
    Object.keys(query).forEach((key) => {
      this.url.append(`${key}`, `eq.${query[key]}`);
    });
    return this;
  }

  limit(size: number) {
    this.url.set(`limit`, size.toString());
    return this;
  }

  offset(offset: number) {
    this.url.set(`offset`, offset.toString());
    return this;
  }
}
