import { appendErrors, transformToNestObject, Resolver } from 'react-hook-form';
import Ajv, { RequiredParams } from 'ajv';

const parseErrorSchema = (
  errors: Array<Ajv.ErrorObject>,
  validateAllFieldCriteria: boolean
) => {
  enrichErrors(errors);

  return errors.reduce(
    (previous: Record<string, any>, { dataPath, message = '', keyword }) => ({
      ...previous,
      ...(dataPath
        ? previous[dataPath] && validateAllFieldCriteria
          ? {
            [dataPath]: appendErrors(
              dataPath,
              validateAllFieldCriteria,
              previous,
              keyword,
              message
            ),
          }
          : {
            [dataPath]: previous[dataPath] || {
              message,
              type: keyword,
              ...(validateAllFieldCriteria
                ? {
                  types: { [keyword]: message || true },
                }
                : {})
            },
          }
        : {}),
    }),
    {},
  );
};

const enrichErrors = (
  errors: Array<Ajv.ErrorObject>
) => {
  for (let i = 0; i < errors.length; i++) {
    switch (errors[i].keyword) {
      case 'required':
        errors[i].dataPath = (errors[i].params as RequiredParams).missingProperty;
        break;
    }
  }
};

export const ajvResolver = <TFieldValues extends Record<string, any>>(
  schema: object,
  options: Ajv.Options = {
    allErrors: true
  },
  localize?: (errors: Array<Ajv.ErrorObject>) => void
): Resolver<TFieldValues> => async (
  values,
  _,
  validateAllFieldCriteria = false,
) => {
  const clearedValues: Record<string, any> = {};
  Object.keys(values).forEach((value) => {
    if (values[value] && values[value] !== '') {
      clearedValues[value] = values[value];
    }
  });

  const ajv = new Ajv({
    ...options
  });

  const validate = ajv.compile({
    '$async': true,
    ...schema
  });

  try {
    return {
      values: (await validate(clearedValues)) as any,
      errors: {},
    };
  } catch (e) {
    if (localize) {
      localize(e.errors);
    }

    return {
      values: {},
      errors: transformToNestObject(
        parseErrorSchema(e.errors, validateAllFieldCriteria),
      ),
    };
  }
};
