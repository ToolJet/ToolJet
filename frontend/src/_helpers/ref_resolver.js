import _ from 'lodash';
import { deepClone } from './utilities/utils.helpers';

export default class RefResolver {
  constructor(originalJSON) {
    this.originalJSON = originalJSON;
  }

  resolve(inputJSON) {
    const outputJSON = deepClone(inputJSON || this.originalJSON);

    if (typeof outputJSON === 'object') {
      Object.keys(outputJSON).forEach((key) => {
        outputJSON[key] = this.evaluateObject(outputJSON[key]);
      });
    }
    return { result: outputJSON };
  }

  evaluateObject(inputObject) {
    let outputObject = deepClone(inputObject);
    if (typeof outputObject === 'object') {
      if (outputObject.$ref) {
        const array = outputObject.$ref.split('/');
        const cleanedPath = array.slice(1, array.length).join('.');
        const value = _.get(this.originalJSON, cleanedPath);

        return value;
      } else {
        const resolvedJSON = this.resolve(outputObject).result;
        outputObject = resolvedJSON;
      }
    }
    return outputObject;
  }
}
