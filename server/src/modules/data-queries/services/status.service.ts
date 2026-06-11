export class DataQueryStatus {
  constructor(
    private _startTime = new Date().getTime(),
    private _status = 'failure',
    private _error = {},
    private _duration?: number,
    private _options?: any
  ) {}

  setStart() {
    this._startTime = new Date().getTime();
  }

  setSuccess(status?) {
    this.setDuration();
    this._status = status || 'success';
  }

  setOptions(options) {
    this._options = options;
  }

  setFailure(error) {
    this.setDuration();
    this._error = error;
  }

  getMetaData() {
    return {
      status: this._status,
      queryError: this._error,
      duration: this._duration,
      parsedQueryOptions: this._options,
    };
  }

  private setDuration() {
    this._duration = new Date().getTime() - this._startTime;
  }
}
