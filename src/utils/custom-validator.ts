import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

@ValidatorConstraint({ name: 'trimString', async: false })
export class TrimStringValidator implements ValidatorConstraintInterface {
  validate(value: any, _args: ValidationArguments) {
    if (typeof value !== 'string') {
      return false; // Non-string values are not allowed
    }
    // Trim the string and check if it's not empty after trimming
    return value.trim() !== '';
  }

  defaultMessage(_args: ValidationArguments) {
    return 'The value cannot be empty after trimming.';
  }
}

export function ArrayLength(
  length: number,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'arrayLength',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [length],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [constraint] = args.constraints;
          return value.length === constraint;
        },
        defaultMessage(args: ValidationArguments) {
          const [constraint] = args.constraints;
          return `The array must contain exactly ${constraint} elements`;
        },
      },
    });
  };
}

@ValidatorConstraint({ name: 'noSpace', async: false })
export class NoSpaceValidator implements ValidatorConstraintInterface {
  validate(value: any, _args: ValidationArguments) {
    if (typeof value !== 'string') {
      return false; // Non-string values are not allowed
    }
    return !/^\s|\s$/.test(value) && !/\s\s/.test(value); // Return true if there are no spaces
  }

  defaultMessage(_args: ValidationArguments) {
    return 'Spaces are not allowed in this field';
  }
}

@ValidatorConstraint({ async: false })
class NoEmptyStringsConstraint implements ValidatorConstraintInterface {
  validate(value: any[], _args: ValidationArguments) {
    if (!Array.isArray(value)) {
      return false; // Non-array values are not allowed
    }
    return value.every(
      (item) => typeof item === 'string' && item.trim() !== '',
    );
  }
}

export function NoEmptyStrings(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: NoEmptyStringsConstraint,
    });
  };
}

export function Trim(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'trim',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value === 'string') {
            // Trim the string value
            const trimmedValue = value.trim();
            // Assign the trimmed value back to the original field
            args.object[propertyName] = trimmedValue;
          }
          return true;
        },
      },
    });
  };
}
