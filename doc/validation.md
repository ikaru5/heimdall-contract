[back to root](../README.md#Documentation)

# Validation

The validation feature is a powerful tool provided by ContractBase for validating data according to a specified schema.
Validation rules can be added to each field in the schema. The validation rules can be of two types: normal validations and validation breakers.

## isValid Method

The `isValid()` method is used to verify if the data in a contract meets all validation rules. It returns `true` if all validations pass, and `false` otherwise.

The `isValid()` method walks through the contract's schema and validates each property of the contract.

## Error Object

The `errors` object contains the error messages for all failed validations. 
It's an nested object where each key corresponds to a field that has failed validations. The corresponding value is an array containing error messages for that field.

If the `isValid()` method returns `false`, you can check the errors object to identify which validations failed and understand their corresponding error messages.

If multiple validations fail for a single field, the array will contain all the error messages for that field.

Example: 

```javascript
{
  errors: {
    nestedFieldName: {
      fieldA: ["Error message 1", "Error message 2"]
    },
    fieldNameA: ["Error message 1", "Error message 2"],
    fieldNameB: ["Error message 3"]
  }
}
```

## Normal Validations

Normal validations are rules that are checked when the contract's `isValid()` method is called. 
If any of the normal validation rules fail, the `isValid()` method will return false, and the error messages for all failed validations will be added to the `errors` object.

Normal validations are run after validation breakers, and only if no breaker condition has been met. In other words, they are executed only if it's necessary to do so for complete validation.

## Validation Breakers

Validation breakers are conditions that, when met, allow us to skip further validations. 
They serve as a short-circuit to prevent unnecessary or even unwanted validation checks. 
For example, if a field is allowed to be blank (allowBlank), and it is indeed blank, then there's no need to run further validations on it like `min` or `isEmail`.

If a validation breaker rule is satisfied, the validation process for that specific property halts, and it is considered valid regardless of other normal validation rules. 
Note that breaker conditions do not trigger error messages as they are conditions under which we deem the data valid and require no further validation.

Validation breakers also include the special validateIf keyword, which can be used to define a function that determines whether a field should be validated based on its value or other conditions. 
If the validateIf function returns false, the field is considered valid and no further validations are run on it.

## [Custom Validation](validation/validate.md)

You can define custom validation rules using the `validate` keyword in the field definition.

The `validate` keyword allows you to add a custom validation function directly in the field definition. 
The custom validation function should return `true` if the validation is successful, or a string (the error message) if the validation fails.

For arrays and nested contracts, you can define validation breakers using the `validateIf` keyword in the field definition.

## Error Messages

All validations have a simple build-in error message in english that is added to the `errors` object if the validation fails.
They can not be customized, but you can override each of them: [Custom Error Messages](localization.md#custom-error-messages)

It is pretty flexible. But if you need to define your messages globally you will need to use [Localization](localization.md).

## Adding Validation Rules

For sure you can add your own validation rules to your contracts: [Additional Validations](validation/additionalValidations.md)

[back to root](../README.md#Documentation)