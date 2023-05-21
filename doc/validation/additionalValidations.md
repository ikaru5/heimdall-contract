[back to root](../../README.md#Documentation)

# Additional Validations

The "Additional Validation" feature allows you to add custom validation rules that can be used across different fields in your contracts. 
This is useful when you have specific validation requirements that you need to reuse throughout your contracts.

## Usage

To create an extended validation rule, you need to define a validation object and implement the `addAdditionalValidations` method in your contract class.

The `addAdditionalValidations` method should return an object that defines your custom validations. Each validation rule should have a `check` and `message` function.

The `check` function should return `true` if the validation passes, and `false` otherwise. It receives the parameters `(value, isRequired, dType, depth, contract)`.

The `message` function should return a string that will be used as the error message when the validation fails. It receives the same parameters as the `check` function.

Here is an example of a contract with a custom validation rule:

```javascript
class MyContract extends ContractBase {
  addAdditionalValidations() {
    return {
      normal: {
        mustBeOliver: {
          check: (value, isRequired, dType, depth, contract) => {
            return value === "Oliver"
          },
          message: (value, dataType, dType, depth, contract) => {
            return `"${value}" is not Oliver >:-(`
          }
        },
      }
    }
  }
}
```

In this example, the `mustBeOliver` rule checks whether the field's value is equal to the string "Oliver". 
If the value is not "Oliver", the `check` function will return `false` and the validation will fail. The error message will be "${value} is not Oliver >:-(.

## Applying Extended Validation Rules

Once you have defined your custom validation rule, you can apply it to any field in your contract by adding it to the field definition in the schema:

```javascript
{
  fieldName: {dType: "String", presence: true, mustBeOliver: true}
}
```

## Inheritance of Extended Validation Rules

If you have a hierarchy of contracts and you want to add or override validation rules in a child contract, you can call `super.addAdditionalValidations()` to get the parent contract's validation rules, and then add or override rules as needed.

Here is an example of a child contract that adds a new validation rule and overrides an existing one:


```javascript
class ChildContract extends ParentContract {
  addAdditionalValidations() {
    const superClassValidations = super.addAdditionalValidations()

    return {
      normal: { ...superClassValidations.normal, ...myNewValidations.normal },
      breaker: { ...superClassValidations.breaker, ...myNewValidations.breaker }
    }
  }
}
```

In this example, `myNewValidations` is an object that defines new validation rules or overrides existing ones. The `...` operator is used to merge the parent contract's validation rules with the new ones.
This isn't the most beautiful solution, but it is pretty straightforward and has no magic behind it. 

## Note

Extended validation rules can be used with any data type. When creating a custom validation rule, make sure that the `check` function can handle the type of data that the field can contain.

[back to root](../../README.md#Documentation)
