[back to root](../../README.md#Documentation)

# isEmail Validator

The `isEmail` validator checks if a string input follows the structure of a standard email address. This validator can be set to `true`, `false`, or a function returning `true` or `false`.

## Basic Usage

```javascript
{
  fieldName: {dType: "String", match: /^[a-zA-Z0-9\s]*$/}
}
```

In the above example, `fieldName` should match the provided regular expression, which only allows alphanumeric characters and whitespaces. If fieldName does not match this pattern, the validation will fail.

## Dynamic Validation

```javascript
{
  fieldName: {dType: "String", match: (value, contract, dType, depth) => /^[a-zA-Z0-9\s]*$/}
}
```

In this case, a function is provided that returns a regular expression. 
This allows for dynamic determination of the match pattern based on the current state of the field value, the contract, the datatype, and the depth. 
If the value of `fieldName` does not match the returned regular expression, the validation will fail.

## Validation Error Messages

The match validator provides "invalid" as a simple default error message if the field value does not match the specified regular expression.

This message can be localized using the i18next key `errors:generic`.

[back to root](../../README.md#Documentation)
