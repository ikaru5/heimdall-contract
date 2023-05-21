[back to root](../../README.md#Documentation)

# validateIf Breaker

The `validateIf` breaker is a configuration setting that determines whether or not a field should be validated based on a condition. This gives you the flexibility to conditionally apply validations.

## Usage

In your schema, you can define the `validateIf` setting for each field. This setting should be a function that returns a boolean value. The validation will only occur if this function returns `true`.

```javascript
class TestContract extends ContractBase {
  defineSchema() {
    return (
      {
        ...super.defineSchema(),
        ...{
          valueA: {dType: "String", validateIf: (value, contract, dType, depth) => true, min: 10},
        }
      }
    )
  }
}
```


In this example, valueA will only be validated if the function assigned to validateIf returns true.

## Behavior
The validateIf breaker works by invoking the function assigned to the validateIf property. If the function returns true, the field will be validated as usual. If it returns false, the validation for the field will be skipped.

Here are some test cases demonstrating this behavior:

```javascript
it('outbreaks if false returned', () => {
  const testContract = new TestContract()
  ReturnStub.returnValue = false
  testContract.valueA = "invalid" // too short for min: 10
  expect(testContract.isValid()).toBe(true)
  expect(testContract.errors).toStrictEqual({})
})

it('doesnt outbreaks if true returned', () => {
  const testContract = new TestContract()
  ReturnStub.returnValue = true
  testContract.valueA = "invalid"// too short for min: 10
  expect(testContract.isValid()).toBe(false)
  expect(testContract.errors).toStrictEqual({
    valueA: {messages: ["must have at least 10 characters"]},
  })
})
```

In these tests, valueA is only validated when validateIf method returns true. When it's false, the value "invalid" is accepted as valid because the validation is skipped.

[back to root](../../README.md#Documentation)
