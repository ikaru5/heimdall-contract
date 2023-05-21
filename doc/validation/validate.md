[back to root](../../README.md#Documentation)

# Custom Validation

The `validate` keyword allows you to define your own custom validation function for a field. This can be useful when you need to check a condition that is not covered by the standard validators.

## Usage

To use the `validate` keyword, add it to a field definition in the schema. The value of validate should be a function that returns either `true`, `false`, or a string.
A string value is treated as an error, and will be used as the error message for this field.

```javascript
{
  fieldName: {dType: "String", validate: () => true}
}
```

In the example above, the `fieldName`  field has a custom validation function that always passes, because it always returns `true`.

```javascript
{
  fieldName: {dType: "String", validate: (value, contract, dType, depth) => value.includes('@')}
}
```

In the above example, the `fieldName` field must be a string that includes an '@' character. The custom validation function receives the parameters `(value, contract, dType, depth)` and should return a boolean or a string.

If the validation function returns `false`, the field will be considered invalid and a generic error message "Field invalid!" will be added to the errors.


```javascript
{
  fieldName: {dType: "String", validate: (value, contract, dType, depth) => value.includes('@') ? true : "must contain '@'"}
}
```

In the above example, the `fieldName` does not contain an '@' character, the custom validation function returns a custom error message "must contain '@'". This message will be added to the errors.

## Note

The `validate` keyword can be used with any data type. If a custom error message is not provided (i.e., if the function returns `false`), the default error message is "Field invalid!".

There is currently no support for internationalization (i18n) for custom validation error messages. If you need to support multiple languages, you should handle the translations within the validation function itself.

[back to root](../../README.md#Documentation)
