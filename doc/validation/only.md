[back to root](../../README.md#Documentation)

# Only Validator

The `only` validation keyword is used to restrict the value of a field to a specific set of allowed values.

## Usage

The `only` keyword can be added to a field definition in the schema and accepts either a single allowed value, an array of allowed values, or a function returning an allowed value or array of allowed values.

```javascript
{
  fieldName: {dType: "String", only: "only valid value"}
}
```

In the example above, the `fieldName` field must be equal to "only valid value".

When an array is provided, the field value must be one of the values in the array.

```javascript
{
  fieldName: {dType: "String", only: ["Tim", "Tom"]}
}
```

In the above example, the `fieldName` field must be either "Tim" or "Tom".

If a function is provided, it will be called with the parameters `(value, contract, dType, depth)`, and should return an allowed value or array of allowed values.

```javascript
{
  fieldName: {dType: "String", only: () => { /* your logic here */ }}
}
```

## Note

The `only` validator considers a field valid if its value is exactly equal to the allowed value(s), or if the field is empty (`undefined`, `null`, or an empty string/array depending on the `dType`).

The error message for `only` is dynamic and indicates the allowed value(s). For a single allowed value, the message is "must be "{allowedValue}". For multiple allowed values, the message is "must be "{value1}", "{value2}", or "{lastValue}".

The i18next keys for these validation errors are `errors:only.singular` for a single allowed value, and `errors:only.plural` for multiple allowed values. For internationalization (i18n), you can provide translations for these keys in your i18n configuration.

[back to root](../../README.md#Documentation)
