[back to root](../../README.md#Documentation)

# StrictOnly Validator

The `strictOnly` validation keyword is similar to the only keyword but has stricter constraints. It is used to restrict the value of a field to a specific set of allowed values and does not permit empty values.

## Usage

The `strictOnly` keyword can be added to a field definition in the schema and accepts either a single allowed value, an array of allowed values, or a function returning an allowed value or array of allowed values.

```javascript
{
  fieldName: {dType: "String", strictOnly: "only valid value"}
}
```

In the example above, the `fieldName` field must be equal to "only valid value".

When an array is provided, the field value must be one of the values in the array.

```javascript
{
  fieldName: {dType: "String", strictOnly: ["Tim", "Tom"]}
}
```

In the above example, the `fieldName` field must be either "Tim" or "Tom".

If a function is provided, it will be called with the parameters `(value, contract, dType, depth)`, and should return an allowed value or array of allowed values.

```javascript
{
  fieldName: {dType: "String", strictOnly: () => { /* your logic here */ }}
}
```

## Note

Unlike the `only` validator, the `strictOnly` validator does not consider a field to be valid if its value is empty (`undefined`, `null`, or an empty string/array depending on the dType). The field value must be exactly equal to the allowed value(s).

The error message for `strictOnly` is dynamic and indicates the allowed value(s). For a single allowed value, the message is "must be "{allowedValue}". For multiple allowed values, the message is "must be "{value1}", "{value2}", or "{lastValue}".

The i18next keys for these validation errors are `errors:strictOnly.singular` for a single allowed value, and `errors:strictOnly.plural` for multiple allowed values. For internationalization (i18n), you can provide translations for these keys in your i18n resource bundle.

[back to root](../../README.md#Documentation)
