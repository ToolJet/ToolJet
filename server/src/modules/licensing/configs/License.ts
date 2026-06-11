import LicenseBase from './LicenseBase';
import { BASIC_PLAN_TERMS } from '../constants/PlanTerms'; //ce TERMS

export default class License extends LicenseBase {
  private static _instance: License;

  private constructor(key: string, updatedDate: Date) {
    super(BASIC_PLAN_TERMS);
  }

  public static Instance(): License {
    return this._instance;
  }

  public static Reload(key: string, updatedDate: Date): License {
    return (this._instance = new this(key, updatedDate));
  }
}
