import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { getRepository, ILike } from 'typeorm';
import { ValidationArguments } from 'class-validator/types/validation/ValidationArguments';

@ValidatorConstraint({ name: 'IsNotExist', async: true })
export class IsNotExist implements ValidatorConstraintInterface {
  async validate(value: any | object, validationArguments: ValidationArguments) {
    const repository = validationArguments.constraints[0];
    const pathToProperty = validationArguments.constraints[1] || validationArguments.property;
    const isCaseInsensitive = !!validationArguments.constraints[2] || false;
    try {
      const payload = value instanceof Object ? value?.[pathToProperty] : value;
      const entity: unknown = await getRepository(repository).findOne({
        [pathToProperty]: isCaseInsensitive ? ILike(payload) : payload,
      });

      return !entity;
    } catch (err) {
      return false;
    }
  }

  defaultMessage({ value }: ValidationArguments) {
    return `${value} already exists.`;
  }
}
