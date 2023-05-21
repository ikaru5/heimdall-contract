[back to root](../../README.md#Documentation)

# Match Validator

The `match` validator checks if a string input matches a specified regular expression. This validator requires a regular expression as its value, or a function returning a regular expression.

## Usage

The `min` keyword can be added to a field definition in the schema and accepts either a number or a function returning a number.

```javascript
{
  fieldName: {dType: "String", match: /^[a-zA-Z0-9\s]*$/}
}
```

In the example above, the `fieldName` field must be a string with at least 5 characters.

```javascript
{
  fieldName: {dType: "Array", min: 2}
}
```

In the above example, the `fieldName` field must be an array with at least 2 elements.

```javascript
{
  fieldName: {dType: "Number", min: () => 3}
}
```

In the above example, the `fieldName` field must be a number greater than or equal to 3. If a function is provided, it will be called with the parameters (value, contract, dType, depth), and should return the minimum limit.

## Note

The `min` validator is applicable only to the `String`, `Array`, and `Number` data types.

The error message for `min` is dynamic and indicates the minimum limit. For a string, the message is "must have at least {minCount} characters". For an array, the message is "must have at least {minCount} elements". For a number, the message is "must be greater than or equal to {minCount}".

The `i18next` keys for these validation errors are `errors:min.String` for strings, `errors:min.Array` for arrays, and `errors:min.Number` for numbers. For internationalization (i18n), you can provide translations for these keys in your i18n resource bundle.

[back to root](../../README.md#Documentation)
