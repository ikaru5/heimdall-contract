[back to root](../../README.md#Documentation)

# Absence Validator

The `absence` validation keyword is used to enforce that a value must not be present in the data.

## Usage

The `absence` keyword can be added to a field definition in the schema and accepts either a boolean value or a function. A value of `true` means that the field must be absent, while `false` means it is not required to be absent.
```javascript
{
  fieldName: {dType: "String", absence: true}
}
```

In the example above, the fieldName field must be absent or empty.

If a function is provided, it will be called with the parameters `(value, contract, dType, depth)`, and should return `true` if the field must be absent and `false` otherwise.

```javascript
{
  fieldName: {dType: "String", absence: () => { /* your logic here */ }}
}
```

## Note

The `absence` validator considers a field absent if its value is undefined, null, or an empty string/array depending on the dType.

The error message for `absence` is "must be absent". The i18next key for this validation error is `errors:absence.true` with a fallback to `errors:absence`.

For internationalization (i18n), you can provide translations for these keys in your i18n resource bundle.

[back to root](../../README.md#Documentation)
