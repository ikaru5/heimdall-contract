[back to root](../README.md#Documentation)

# Errors

After calling `isValid()` the `errors` property holds a tree of all validation failures. It is empty (`{}`) when the contract is valid.

## Structure

Every node of the tree is an envelope with three separate, optional namespaces, so field names can never collide with structural keys:

- `issues` - the failures of this node itself, an array of `{validation, message}`.
- `fields` - erroneous child fields, keyed by field name.
- `elements` - erroneous array elements, keyed by their index (sparse - only elements with errors are present).

Only namespaces that actually contain errors are present.

```javascript
contract.assign({
  email: "not-an-email",
  address: {street: "", city: "Berlin"},
  tags: ["a"],                       // arrayOf: "String", min: 3, innerValidate: {min: 2}
})
contract.isValid()

contract.errors
// {
//   fields: {
//     email:   {issues: [{validation: "isEmail", message: "must be a valid E-Mail"}]},
//     address: {fields: {street: {issues: [{validation: "presence", message: "not present"}]}}},
//     tags: {
//       issues:   [{validation: "min", message: "must have at least 3 elements"}],  // the array itself
//       elements: {0: {issues: [{validation: "min", message: "must have at least 2 characters"}]}}  // element 0
//     }
//   }
// }
```

Each issue names the `validation` that failed (`"presence"`, `"min"`, `"isEmail"`, `"validate"` for custom validations, or your own additional validations), which lets a UI react per validation instead of parsing message strings.

## Reading Errors

Two helpers cover the common cases so you rarely traverse the tree by hand.

### errorsAt(path)

Returns the error node at a field path, or `undefined` if there are no errors there. The form friendly way to get the errors of a single input. Array elements are addressed by index:

```javascript
contract.errorsAt("email")?.issues                 // [{validation: "isEmail", message: "..."}]
contract.errorsAt("address.street")?.issues        // nested fields
contract.errorsAt("tags.0")?.issues                // array element by index
contract.errorsAt(["tags", 0])?.issues             // array path form
contract.errorsAt("address.city")                  // undefined - no errors here
```

### flatErrors()

Returns all errors as a flat list of `{path, validation, message}` - handy for toasts, logging or an error summary. Array indices in the path are numbers:

```javascript
contract.flatErrors()
// [
//   {path: ["email"], validation: "isEmail", message: "must be a valid E-Mail"},
//   {path: ["address", "street"], validation: "presence", message: "not present"},
//   {path: ["tags"], validation: "min", message: "must have at least 3 elements"},
//   {path: ["tags", 0], validation: "min", message: "must have at least 2 characters"},
// ]
```

## TypeScript

For contracts built with the [`contractClass` factory](typescript.md#type-inference) the `errors` tree is typed from the schema: `fields` keys autocomplete, array fields carry `elements`, and nested contracts contribute their own error types. See [TypeScript](typescript.md).

[back to root](../README.md#Documentation)
