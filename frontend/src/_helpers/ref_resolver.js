import _ from 'lodash';

export default class RefResolver {
  constructor(originalJSON) {
    this.originalJSON = originalJSON;
  }

  resolve(inputJSON) {
    const outputJSON = _.cloneDeep(inputJSON || this.originalJSON);

    if (typeof outputJSON === 'object') {
      Object.keys(outputJSON).forEach((key) => {
        outputJSON[key] = this.evaluateObject(outputJSON[key]);
      });
    }
    return { result: outputJSON };
  }

  evaluateObject(inputObject) {
    let outputObject = _.cloneDeep(inputObject);
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
