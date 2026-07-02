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
| `Number` | `number \| null` |
| `Boolean` | `boolean \| undefined` |
| `Generic` | `any` |
| `Array` | `Array<element type>` |
| `Contract` | the nested contract instance type |

Schema typos are compile errors at the factory boundary (and still runtime `SchemaError`s for
JavaScript users): unknown keywords are caught by the `ValidateSchema` guard type, invalid values
like `dType: "Strng"` by the schema types themselves.

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

- `toObject()` stays `Record<string, unknown>` - key remapping via `as`/`renderAs` is not reflected yet.
- A `default` value does not narrow the type (e.g. a Boolean with `default: false` is still typed `boolean | undefined`).
- Keyword typos inside `innerValidate` are only caught at runtime by the schema lint, not at compile time.

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
