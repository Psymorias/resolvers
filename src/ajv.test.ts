import { ajvResolver } from './ajv';

const errors = {
  message: "validation failed",
  errors: [
    {
      keyword: "minLength",
      dataPath: ".firstName",
      schemaPath: "#/properties/firstName/minLength",
      params: {
        limit: 1
      },
      message: "should NOT be shorter than 1 characters"
    },
    {
      keyword: "minLength",
      dataPath: ".email",
      schemaPath: "#/properties/email/minLength",
      params: {
        limit: 1
      },
      message: "should NOT be shorter than 1 characters"
    },
    {
      keyword: "format",
      dataPath: ".email",
      schemaPath: "#/properties/email/format",
      params: {
        format: "email"
      },
      message: "should match format \"email\""
    },
    {
      keyword: "enum",
      dataPath:".options",
      schemaPath: "#/properties/options/enum",
      params: {
        allowedValues: ["Option 1", "Option 2"]
      },
      message:"should be equal to one of the allowed values"
    }
  ],
  validation: true,
  ajv: true
};

const schema = {
  type: "object",
  properties: {
    firstName: { type: "string", minLength: 1 },
    email: { type: "string", format: "email", minLength: 1, maxLength: 50 },
    options: { type: "string", enum: ["Option 1", "Option 2"] }
  },
  required: [
    "firstName",
    "email",
    "options"
  ],
  additionalProperties: false
}

describe('ajvResolver', () => {
  it('should get values', async () => {
    const data = {
      firstName: 'jimmy',
      email: 'test@test.de',
      options: 'Option 1'
    };
    expect(await ajvResolver(schema)(data)).toEqual({
      errors: {},
      values: {
        firstName: 'jimmy',
        email: 'test@test.de',
        options: 'Option 1'
      },
    });
  });

  it('should get errors', async () => {
    const data = {
      firstName: 2,
      email: undefined,
      options: 'three'
    };
    expect(await ajvResolver(schema)(data)).toMatchSnapshot();
  });
});

describe('ajv - validateWithSchema', () => {
  it('should return undefined when no error reported', async () => {
    expect(
      await ajvResolver({
        validate: () => {
          throw errors;
        },
      } as any)({}),
    ).toMatchSnapshot();
  });

  it('should return empty object when validate pass', async () => {
    expect(
      await ajvResolver({
        validate: () => new Promise((resolve) => resolve()),
      } as any)({}),
    ).toEqual({
      errors: {},
      values: {},
    });
  });
});
