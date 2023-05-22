[back to root](../../README.md#Documentation)

# Context Validation with on Breaker

The `on` validation breaker, like other breakers, is used to alter the normal flow of validation. 
It allows certain validation rules to apply only under certain conditions. Here's a breakdown of how it works:

## Usage

`on` is a property of a validation rule and it takes a single string value or an array of string values as its argument. 
These values represent validation contexts. For example:

```javascript
{
  string: {dType: "String", match: /^[a-zA-Z0-9\s]*$/, on: ["contextA", "contextB"]},
  number: {dType: "Number", min: 10, on: "contextA"},
}
```
In the example above, the string field's validation rules will only be applied when the current validation context is either "contextA" or "contextB". Similarly, the number field's validation rules will only be applied when the current validation context is "contextA".

## matchAnyContext

There is a special validation context called `matchAnyContext`. If you specify this context like `isValid("matchAnyContext")` all validation rules will be applied. 

## Setting the Validation Context

The validation context can be set when calling the isValid method of a contract. You can pass a single context or an array of contexts to isValid. For example:

```javascript
contract.isValid("contextA")
contract.isValid(["contextA", "contextB"])
```

## Validation Break
When validating a field, if the current validation context does not match any of the contexts specified in the field's on property, the validation for that field will be skipped.

## Nested Contracts

The on validation breaker also supports nested contracts. This means you can specify validation contexts for nested fields. If the validation context for a nested field does not match the current validation context, the validation for that field will be skipped.

## Inner Validation

TODO: need better examples here, but I'm pretty sure that it is very intuitive and easy to understand, when you will really need it.

For array fields, you can specify an innerValidate property to define validation rules for the elements of the array. If you provide an on property in innerValidate, it will define validation contexts for the elements of the array.

Here's an example:

```javascript
{
    subsContracted: {dType: "Array", min: 3, arrayOf: SubContextContract, allowBlank: false, on: "contextB", innerValidate: {on: "contextB"}},
}
```

In the example above, the subsContracted field's validation rules will only be applied when the current validation context is "contextB". Furthermore, the elements of the subsContracted array will also have their validation rules applied only when the current validation context is "contextB".

[back to root](../../README.md#Documentation)
