import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { getRepository, ILike } from 'typeorm';
import { ValidationArguments } from 'class-validator/types/validation/ValidationArguments';

@ValidatorConstraint({ name: 'IsNotExist', async: true })
export class IsNotExist implements ValidatorConstraintInterface {
  async validate(value: any, validationArguments: ValidationArguments) {
    const {
      entityClassOrTableName = null,
      property = validationArguments.property,
      isCaseInsensitive = false,
    } = validationArguments.constraints?.[0] || {};

    try {
      const record: unknown = await getRepository(entityClassOrTableName).findOne({
        [property]: isCaseInsensitive ? ILike(value) : value,
      });

      return !record;
    } catch (err) {
      return false;
    }
  }

  defaultMessage({ value }: ValidationArguments) {
    return `${value} already exists.`;
  }
}
