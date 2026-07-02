[back to root](../README.md#Documentation)

# TypeScript

Heimdall Contract ships with type declarations - no `@types` package needed. The runtime stays plain JavaScript:
the declarations for the API are generated from the JSDoc (`npm run build:types`), while the schema type
vocabulary lives handwritten in `types.d.ts`.

## Defining Contracts

Contract fields only exist at runtime, so declare them on your subclass with the TypeScript `declare` keyword -
it is a pure type declaration without any runtime effect. Annotate `defineSchema` with the `Schema` return type
to get autocomplete and typo checking for all schema keywords:

```typescript
import ContractBase from "@ikaru5/heimdall-contract"
import type {Schema} from "@ikaru5/heimdall-contract/types"

class SignupContract extends ContractBase {
  declare email: string
  declare username: string
  declare password: string
  declare passwordRepeat: string

  defineSchema(): Schema {
    return {
      ...super.defineSchema(),
      email: {dType: "String", presence: true, isEmail: true},
      username: {dType: "String", presence: true, min: 8},
      password: {dType: "String", presence: true, min: 8},
      passwordRepeat: {
        dType: "String", presence: true,
        validate: (value, contract) => value === contract.password ? true : "passwords do not match",
      },
    }
  }
}
```

**Note**: the `defineSchema(): Schema` annotation matters. Without it, TypeScript widens `dType: "String"`
to `string` and neither autocomplete nor typo checking work inside the schema. With it, a typo like
`presense` is a compile error - and for plain JavaScript users the same typo is caught at runtime by
[Schema Linting](schema.md#schema-linting).

Inside `validate`, `validateIf` and other schema callbacks the `contract` parameter is typed as the contract
API plus arbitrary field access (`AnyContract`), so comparing against sibling fields like `contract.password`
just works.

## Type Inference

If you prefer your field types derived from the schema instead of declaring them - like Zod infers types
from its schemas - use the `contractClass` factory. It is a tiny runtime helper (see
[General Usage](general_usage.md#alternative-creating-a-contract-class-with-the-contractclass-factory))
whose declaration infers the instance fields from the schema literal:

```typescript
import {contractClass} from "@ikaru5/heimdall-contract"

const AddressContract = contractClass({
  street: {dType: "String", presence: true},
  city: {dType: "String", presence: true},
})

const SignupContract = contractClass({
  email: {dType: "String", presence: true, isEmail: true},
  age: {dType: "Number", allowBlank: true},
  tags: {dType: "Array", arrayOf: "String"},
  address: {dType: "Contract", contract: AddressContract},
})

const contract = new SignupContract()
contract.email          // string
contract.age            // number | null
contract.tags           // Array<string>
contract.address.street // string - nested contracts compose
```

The inferred types mirror the runtime exactly - every field always exists, initialized with its
default empty value:

| dType | inferred type |
| --- | --- |
| `String` | `string` |
| `Number` | `number \| null` (`number` with a number `default`) |
| `Boolean` | `boolean \| undefined` (`boolean` with a boolean `default`) |
| `Generic` | `any` |
| `Array` | `Array<element type>` |
| `Contract` | the nested contract instance type |

A field with a matching `default` can never hold its empty value, so the empty type is removed
from the union - `agb: {dType: "Boolean", default: false}` infers plain `boolean`.

Schema typos are compile errors at the factory boundary (and still runtime `SchemaError`s for
JavaScript users): unknown keywords are caught by the `ValidateSchema` guard type, invalid values
like `dType: "Strng"` by the schema types themselves. This includes the keywords inside
`innerValidate`, mirroring the runtime keyword lint - arrays of basic types support the full
validation set, contract arrays only breakers (`allowBlank`, `on`, `validateIf`).

Inheritance works through the second argument instead of `super.defineSchema()` spreading:

```typescript
const EmployeeContract = contractClass({staffId: {dType: "Number"}}, SignupContract)
new EmployeeContract().email // string - inherited fields stay typed
```

And if you need custom methods or hooks, extend the returned class:

```typescript
class SignupContract extends contractClass({email: {dType: "String", isEmail: true}}) {
  emailDomain() {
    return this.email.split("@")[1]
  }
}
```

### Typed toObject()

For factory built contracts the return type of `toObject()` is inferred as well, including the
key remapping through `renderAs` and `as` (`renderAs` wins, matching the runtime) and the rendered
types of nested contracts:

```typescript
const ProductContract = contractClass({
  name: {dType: "String", presence: true},
  price: {dType: "Number", as: "priceCents", default: 0},
  internalNote: {dType: "String", renderAs: "note"},
})

const rendered = new ProductContract().toObject()
rendered.name        // string
rendered.priceCents  // number - remapped by "as", narrowed by the default
rendered.note        // string - remapped by "renderAs"
rendered.internalNote // compile error - the schema key does not exist in the output
```

For the array form of `renderAs`/`as` the runtime renders under the first key. The types can only
see that when the array keeps its tuple form, so declare it `as const`:

```typescript
{dType: "String", renderAs: ["primary", "fallback"] as const} // output key: "primary"
```

Without `as const` the key degrades to a string index signature.

### Inference with handwritten classes

If you want to keep the classic class pattern and still get inference, extract the schema into a
`satisfies Schema` constant (which keeps the literal type - an explicit `: Schema` annotation would
erase it) and merge the inferred fields into the class with a one line interface:

```typescript
import type {InferContract, Schema} from "@ikaru5/heimdall-contract/types"

const profileSchema = {
  username: {dType: "String", presence: true},
  visits: {dType: "Number"},
} satisfies Schema

interface ProfileContract extends InferContract<typeof profileSchema> {}
class ProfileContract extends ContractBase {
  defineSchema(): Schema {
    return {...super.defineSchema(), ...profileSchema}
  }
}
```

### Current limits

- `assign()` input stays untyped (`any`) - it is intentionally permissive: partial data, `parseAs` keys and unknown keys are all valid input.
- When a factory contract inherits from a handwritten class, the fields of that base render as `Record<string, unknown>` in the `toObject()` type - only inference-built parts are precise.

## Custom Validations

If you register custom validations via [additionalValidations](validation/additionalValidations.md), teach
TypeScript the new keywords through declaration merging - `PropertyDefinition` is an interface for exactly
this reason:

```typescript
declare module "@ikaru5/heimdall-contract/types" {
  interface PropertyDefinition {
    mustBeOliver?: boolean
  }
}
```

## Meta Keywords

Keywords starting with an underscore (like `_label` or `_placeholder`) are always allowed by the types,
matching the [ignoreUnderscoredFields](configuration.md) runtime behavior:

```typescript
email: {dType: "String", presence: true, _label: "E-Mail address"}
```

## Useful Types

Everything is exported from `@ikaru5/heimdall-contract/types`:

- `Schema` / `PropertyDefinition` - the schema vocabulary
- `Dtype` / `BasicDtype` - the data type unions
- `AdditionalValidations` / `ValidationDefinition` / `CheckParams` / `MessageParams` - for custom validations
- `CustomLocalization` / `CustomLocalizationParams` - for localization callbacks
- `ValidationErrors` - the shape of `contract.errors`
- `Options` / `ContractConfig` - constructor options and configuration

`SchemaError` is a runtime class and exported from the main module:

```typescript
import ContractBase, {SchemaError} from "@ikaru5/heimdall-contract"
```

[back to root](../README.md#Documentation)
