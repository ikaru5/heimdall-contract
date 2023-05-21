[back to root](../../README.md#Documentation)

# allowBlank Validation Breaker

The allowBlank validation breaker is a special validation rule that, when met, will stop other validation rules on the same field from being checked. 
It can be set to true, false/undefined or a function that returns a boolean. Let's break down its behavior:

## Behavior
The allowBlank setting works by checking the following conditions for the value of a field:

- If the value is undefined or null
- If the value is a string or array with a length of 0
- If the value is an object and its isAssignedEmpty property is true

## Usage

In your schema, you can define the `allowBlank` setting for each field. This setting can take one of the following values:

- `false`: This does nothing as you would not set it to `undefined`.
- `true`: This allows blank values for the field.
- A function: This function can take the value, contract, data type, and depth as arguments and return a boolean indicating whether blank values are allowed or not.

```javascript
class TestContract extends ContractBase {
  defineSchema() {
    return (
      {
        ...super.defineSchema(),
        ...{
          valueA: {dType: "String", min: 10},
          valueB: {dType: "String", min: 10, allowBlank: false}, // makes no sence ;) 
          valueC: {dType: "String", min: 10, allowBlank: true},
          valueD: {dType: "String", min: 10, allowBlank: () => true},
          valueE: {dType: "String", min: 10, allowBlank: (value, contract, dType, depth) => true},
          valueF: {dType: "String", min: 10, allowBlank: undefined}, // makes no sence ;) 
        }
      }
    )
  }
}
```
[back to root](../../README.md#Documentation)
