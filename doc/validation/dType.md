[back to root](../../README.md#Documentation)

# dType validation

The `dType` validation ensures that the value assigned to a contract's field matches the expected data type. The data type is specified through the dType property in the field's schema definition.

The `dType` validation is fundamental and required for all other validations to work correctly. Hence, it must be set for each field in the contract.

## Example
Here is an example of a contract that uses dType validation:

```javascript
class TestContract extends ContractBase {
  defineSchema() {
    return (
      {
        ...super.defineSchema(),
        ...{
          valueA: {dType: "String"},
          valueB: {dType: "Number"},
          valueC: {dType: "Boolean"},
          valueD: {dType: "Generic"},
          valueE: {
            dType: "Array",
            arrayOf: "String" // can also be a contract like {dType: "Array", arrayOf: SomeContract}
          },
          valueF: {dType: "Contract", contract: SomeContract},
          valueG: {dType: "Invalid"},
        }
      }
    )
  }
}
```

In this example, each field in the contract is assigned a specific data type through the dType property.

## Validation Logic
The `dType` validation works by checking the type of the value assigned to the field. It uses the JavaScript typeof operator to determine the type of the value. If the type of the value matches the expected data type specified in the dType property, the validation passes. Otherwise, it fails.

For example, if `dType` is set to "String", the validation will pass if the value is a string. If the value is a number, boolean, object, or any other non-string value, the validation will fail.

The following data types are supported:

- "String": The value must be a string.
- "Number": The value must be a number.
- "Boolean": The value must be a boolean.
- "Generic": Any value is accepted.
- "Array": The value must be an array. The type of the array elements is specified through the `arrayOf` property (required).
- "Contract": The value is a nested contract. The contract type is specified through the `contract` property (required).

[back to root](../../README.md#Documentation)
