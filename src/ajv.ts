import { appendErrors, transformToNestObject, Resolver } from 'react-hook-form';
import Ajv from 'ajv';


const parseErrorSchema = (
  error: Array<Ajv.ErrorObject>,
  validateAllFieldCriteria: boolean,
) =>
  error.reduce(
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
              message,
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
                : {}),
            },
          }
        : {}),
    }),
    {},
  );

export const ajvResolver = <TFieldValues extends Record<string, any>>(
  schema: object,
  options: Ajv.Options = {
    allErrors: true
  },
): Resolver<TFieldValues> => async (
  values,
  _,
  validateAllFieldCriteria = false,
) => {
  const ajv = new Ajv({
    ...options
  });

  const validate = ajv.compile({
    '$async': true,
    ...schema
  });

  try {
    return {
      values: (await validate(values)) as any,
      errors: {},
    };
  } catch (e) {
    return {
      values: {},
      errors: transformToNestObject(
        parseErrorSchema(e.errors, validateAllFieldCriteria),
      ),
    };
  }
};
