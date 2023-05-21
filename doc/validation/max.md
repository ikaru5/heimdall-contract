[back to root](../../README.md#Documentation)

# Max Validator

The `max` validation keyword is used to specify a minimum limit for the value of a field. This limit can apply to the length of a string or array, or the value of a number.

## Usage

The `max` keyword can be added to a field definition in the schema and accepts either a number or a function returning a number.

```javascript
{
  fieldName: {dType: "String", max: 5}
}
```

In the example above, the `fieldName` field must be a string with 5 or fewer characters.

```javascript
{
  fieldName: {dType: "Array", max: 2}
}
```

In the above example, the `fieldName` field must be an array with 3 or fewer elements.

```javascript
{
  fieldName: {dType: "Number", max: () => 3}
}
```

In the above example, the `fieldName` field must be a number less than or equal to 3. If a function is provided, it will be called with the parameters `(value, contract, dType, depth)`, and should return the maximum limit.

## Note

The `max` validator is applicable only to the `String`, `Array`, and `Number` data types.

The error message for `max` is dynamic and indicates the minimum limit. For a string, the message is "must have at least {maxCount} characters". For an array, the message is "must have at least {maxCount} elements". For a number, the message is "must be greater than or equal to {maxCount}".

The `i18next` keys for these validation errors are `errors:max.String` for strings, `errors:max.Array` for arrays, and `errors:max.Number` for numbers. For internationalization (i18n), you can provide translations for these keys in your i18n resource bundle.

[back to root](../../README.md#Documentation)
