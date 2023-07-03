export default class PostgrestQueryBuilder {
  constructor() {
    this.url = new URLSearchParams();
  }
  /**
   * The reserved word order reorders the response rows.
   *
   * @param column  The column to filter on.
   * @param value  The value to filter with.
   */
  order(column, value) {
    this.url.get('order')
      ? this.url.set('order', `${this.url.get('order')},${column}.${value}`)
      : this.url.append(`order`, `${column}.${value}`);
    return this;
  }
  /**
   * Finds all rows which doesn't satisfy the filter.
   *
   * @param column  The column to filter on.
   * @param operator  The operator to filter with.
   * @param value  The value to filter with.
   */
  not(column, value, operator = 'eq') {
    this.url.append(`${column}`, `not.${operator}.${value}`);
    return this;
  }
  /**
   * Finds all rows satisfying at least one of the filters.
   *
   * @param filters  The filters to use, separated by commas.
   * @param foreignTable  The foreign table to use (if `column` is a foreign column).
   */
  or(filters, { foreignTable } = {}) {
    const key = typeof foreignTable === 'undefined' ? 'or' : `${foreignTable}.or`;
    this.url.append(key, `(${filters})`);
    return this;
  }
  /**
   * Finds all rows whose value on the stated `column` exactly matches the
   * specified `value`.
   *
   * @param column  The column to filter on.
   * @param value  The value to filter with.
   */
  eq(column, value) {
    this.url.append(`${column}`, `eq.${value}`);
    return this;
  }
  /**
   * Finds all rows whose value on the stated `column` doesn't match the
   * specified `value`.
   *
   * @param column  The column to filter on.
   * @param value  The value to filter with.
   */
  neq(column, value) {
    this.url.append(`${column}`, `neq.${value}`);
    return this;
  }
  /**
   * Finds all rows whose value on the stated `column` is greater than the
   * specified `value`.
   *
   * @param column  The column to filter on.
   * @param value  The value to filter with.
   */
  gt(column, value) {
    this.url.append(`${column}`, `gt.${value}`);
    return this;
  }
  /**
   * Finds all rows whose value on the stated `column` is greater than or
   * equal to the specified `value`.
   *
   * @param column  The column to filter on.
   * @param value  The value to filter with.
   */
  gte(column, value) {
    this.url.append(`${column}`, `gte.${value}`);
    return this;
  }
  /**
   * Finds all rows whose value on the stated `column` is less than the
   * specified `value`.
   *
   * @param column  The column to filter on.
   * @param value  The value to filter with.
   */
  lt(column, value) {
    this.url.append(`${column}`, `lt.${value}`);
    return this;
  }
  /**
   * Finds all rows whose value on the stated `column` is less than or equal
   * to the specified `value`.
   *
   * @param column  The column to filter on.
   * @param value  The value to filter with.
   */
  lte(column, value) {
    this.url.append(`${column}`, `lte.${value}`);
    return this;
  }
  /**
   * Finds all rows whose value in the stated `column` matches the supplied
   * `pattern` (case sensitive).
   *
   * @param column  The column to filter on.
   * @param pattern  The pattern to filter with.
   */
  like(column, pattern) {
    this.url.append(`${column}`, `like.${pattern}`);
    return this;
  }
  /**
   * Finds all rows whose value in the stated `column` matches the supplied
   * `pattern` (case insensitive).
   *
   * @param column  The column to filter on.
   * @param pattern  The pattern to filter with.
   */
  ilike(column, pattern) {
    this.url.append(`${column}`, `ilike.${pattern}`);
    return this;
  }
  /**
   * A check for exact equality (null, true, false), finds all rows whose
   * value on the stated `column` exactly match the specified `value`.
   *
   * @param column  The column to filter on.
   * @param value  The value to filter with.
   */
  is(column, value) {
    if (value === 'notNull') {
      this.url.append(`${column}`, `not.is.null`);
    } else {
      this.url.append(`${column}`, `is.${value}`);
    }
    return this;
  }

  /**
   * Finds all rows whose value on the stated `column` is found on the
   * specified `values`.
   *
   * @param column  The column to filter on.
   * @param values  The values to filter with.
   */
  in(column, values) {
    const cleanedValues = values
      .map((s) => {
        // handle postgrest reserved characters
        // https://postgrest.org/en/v7.0.0/api.html#reserved-characters
        if (typeof s === 'string' && new RegExp('[,()]').test(s)) return `"${s}"`;
        else return `${s}`;
      })
      .join(',');
    this.url.append(`${column}`, `in.(${cleanedValues})`);
    return this;
  }
  /**
   * Finds all rows whose json, array, or range value on the stated `column`
   * contains the values specified in `value`.
   *
   * @param column  The column to filter on.
   * @param value  The value to filter with.
   */
  contains(column, value) {
    if (typeof value === 'string') {
      // range types can be inclusive '[', ']' or exclusive '(', ')' so just
      // keep it simple and accept a string
      this.url.append(`${column}`, `cs.${value}`);
    } else if (Array.isArray(value)) {
      // array
      this.url.append(`${column}`, `cs.{${value.join(',')}}`);
    } else {
      // json
      this.url.append(`${column}`, `cs.${JSON.stringify(value)}`);
    }
    return this;
  }
  /**
   * Finds all rows whose json, array, or range value on the stated `column` is
   * contained by the specified `value`.
   *
   * @param column  The column to filter on.
   * @param value  The value to filter with.
   */
  containedBy(column, value) {
    if (typeof value === 'string') {
      // range
      this.url.append(`${column}`, `cd.${value}`);
    } else if (Array.isArray(value)) {
      // array
      this.url.append(`${column}`, `cd.{${value.join(',')}}`);
    } else {
      // json
      this.url.append(`${column}`, `cd.${JSON.stringify(value)}`);
    }
    return this;
  }
  /**
   * Finds all rows whose range value on the stated `column` is strictly to the
   * left of the specified `range`.
   *
   * @param column  The column to filter on.
   * @param range  The range to filter with.
   */
  rangeLt(column, range) {
    this.url.append(`${column}`, `sl.${range}`);
    return this;
  }
  /**
   * Finds all rows whose range value on the stated `column` is strictly to
   * the right of the specified `range`.
   *
   * @param column  The column to filter on.
   * @param range  The range to filter with.
   */
  rangeGt(column, range) {
    this.url.append(`${column}`, `sr.${range}`);
    return this;
  }
  /**
   * Finds all rows whose range value on the stated `column` does not extend
   * to the left of the specified `range`.
   *
   * @param column  The column to filter on.
   * @param range  The range to filter with.
   */
  rangeGte(column, range) {
    this.url.append(`${column}`, `nxl.${range}`);
    return this;
  }
  /**
   * Finds all rows whose range value on the stated `column` does not extend
   * to the right of the specified `range`.
   *
   * @param column  The column to filter on.
   * @param range  The range to filter with.
   */
  rangeLte(column, range) {
    this.url.append(`${column}`, `nxr.${range}`);
    return this;
  }
  /**
   * Finds all rows whose range value on the stated `column` is adjacent to
   * the specified `range`.
   *
   * @param column  The column to filter on.
   * @param range  The range to filter with.
   */
  rangeAdjacent(column, range) {
    this.url.append(`${column}`, `adj.${range}`);
    return this;
  }
  /**
   * Finds all rows whose array or range value on the stated `column` overlaps
   * (has a value in common) with the specified `value`.
   *
   * @param column  The column to filter on.
   * @param value  The value to filter with.
   */
  overlaps(column, value) {
    if (typeof value === 'string') {
      // range
      this.url.append(`${column}`, `ov.${value}`);
    } else {
      // array
      this.url.append(`${column}`, `ov.{${value.join(',')}}`);
    }
    return this;
  }
  /**
   * Finds all rows whose text or tsvector value on the stated `column` matches
   * the tsquery in `query`.
   *
   * @param column  The column to filter on.
   * @param query  The Postgres tsquery string to filter with.
   * @param config  The text search configuration to use.
   * @param type  The type of tsquery conversion to use on `query`.
   */
  textSearch(column, query, { config, type = null } = {}) {
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
  /**
   * Finds all rows whose `column` satisfies the filter.
   *
   * @param column  The column to filter on.
   * @param operator  The operator to filter with.
   * @param value  The value to filter with.
   */
  filter(column, operator, value) {
    this.url.append(`${column}`, `${operator}.${value}`);
    return this;
  }
  /**
   * Finds all rows whose columns match the specified `query` object.
   *
   * @param query  The object to filter with, with column names as keys mapped
   *               to their filter values.
   */
  match(query) {
    Object.keys(query).forEach((key) => {
      this.url.append(`${key}`, `eq.${query[key]}`);
    });
    return this;
  }

  limit(size) {
    this.url.set(`limit`, size);
    return this;
  }

  offset(offset) {
    this.url.set(`offset`, offset);
    return this;
  }
}
