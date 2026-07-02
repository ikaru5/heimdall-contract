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
