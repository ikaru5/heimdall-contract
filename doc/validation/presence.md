[back to root](../../README.md#Documentation)

# Presence Validator

The presence validation keyword can be used to enforce the requirement that a value must be present in the data.

## Usage

The presence keyword can be added to a field definition in the schema and accepts either a boolean value or a function. A value of true means that the field is required to be present, while false means it is not.

```javascript
{
  fieldName: {dType: "String", presence: true}
}
```

In the example above, the fieldName field is required to be a non-empty string.

If a function is provided, it will be called with the parameters (value, contract, dType, depth), and should return true if the field is required and false otherwise.

```javascript
{
  fieldName: {dType: "String", presence: () => { /* your logic here */ }}
}
```

## Note
The presence validator behaves differently based on the `dType` of the field:

- "String": A string is considered present if it's not an empty string.
- "Number": A number is considered present as long as it's a number, including `0`.
- "Boolean": A boolean is considered present as long as it's either `true` or `false`.
- "Generic": A generic is considered present as long as it's not `undefined` or `null`.
- "Array": An array is considered present if it's not an empty array.

The error message for `presence` is "not present". The `i18next` key for this validation error is `errors:presence.true` with a fallback to errors:presence.

For internationalization (i18n), you can provide translations for these keys in your i18n configuration.

[back to root](../../README.md#Documentation)
