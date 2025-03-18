import LicenseBase from './LicenseBase';

export default class License extends LicenseBase {
  private static _instance: License;

  private constructor(key: string, updatedDate: Date) {
    super();
  }

  public static Instance(): License {
    return this._instance;
  }

  public static Reload(key: string, updatedDate: Date): License {
    return (this._instance = new this(key, updatedDate));
  }
}
