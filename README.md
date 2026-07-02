# Heimdall Contract

[![Tests](https://github.com/ikaru5/heimdall-contract/actions/workflows/test.yml/badge.svg)](https://github.com/ikaru5/heimdall-contract/actions/workflows/test.yml)
![Coverage Badge](./coverage-badge.svg)

Inheritable and nestable data Objects with intuitive validation schema in your JS-Project.
Target is to create Contracts like Rubys Trailblazer-Reform for your JS-Frontend like React, Vue or any other JS project (also backend).

# Goals
- RELIABLE: Heimdall Contracts got 100% test coverage.
- REUSABLE: Contracts can be reused in other contracts. Thanks to validation context and inheritance you can reuse contracts with different validation rules.
- EXTENSIBLE: You can extend the validation schema with your own validators.
- INTUITIVE: The validation schema is intuitive and easy to understand.
- INDEPENDENT: Heimdall Contracts are independent of any other library. It is not tied to any state management system or framework.
- TESTABLE: Contracts are easy to test. Just take a look at the tests. ;)
- DOCUMENTED: The documentation is written in a way that you can understand it without any prior knowledge.
- FLEXIBLE: You can use Heimdall Contracts in any JS project. It is not tied to any framework or state management system.
- LIGHTWEIGHT: Heimdall Contracts is lightweight. It has no dependencies and is only 3.1kb minified and gzipped.
- TRANSLATABLE: You can use your own translation library like i18next for error messages.

## Why Heimdall and not Zod, Yup or Valibot?

Short answer: they solve a different problem.

Zod, Yup and Valibot are schema **parsers**: you throw data at a schema, get a validated result and are done — stateless and perfect for type-checking data at an API boundary.

A Heimdall Contract is a **form object** (inspired by Ruby's Trailblazer-Reform): a stateful, class-based data holder that accompanies the whole lifecycle of a form or process:

- Instantiate it empty and bind your inputs directly to its properties.
- `assign()` nested data from your API or state management — including key mapping via `parseAs`/`renderAs`.
- Validate the same contract differently per situation using validation contexts (`on: "signup"`).
- Reuse and extend contracts through class inheritance and nesting.
- Render a clean object for sending with `toObject()`.

If you just need to parse and type-check data once (especially with TypeScript type inference), use Zod — the tools complement each other rather than compete. If you need a reusable, stateful data object living between your UI and your API, that is what Heimdall Contract is built for.

## Example

First lets build a signup data contract!

```Javascript
class SignupContract extends ContractBase {

  defineSchema() {
    return (
      {
        ...super.defineSchema(), // optional: used for inheritance ;)
        ...{
          name: {dType: "String", presence: true},
          agb: {dType: "Boolean", default: false, only: true},
          email: {dType: "String", presence: true, isEmail: true},
          username: {dType: "String", presence: true, min: 8},
          password: {dType: "String", presence: true, min: 8},
          passwordRepeat: {
            dType: "String", presence: true,
            validate: (value, contract) => {
              return value === contract.password ? true : false // for custom error message return string instead of false. 
              // Note: Custom validation functions return final messages and are not automatically translated
            }
          },
          address: {
            street: {dType: "String", presence: true},
            streetNumber: {dType: "Number", presence: true},
            plz: {dType: "String", presence: true},
            city: {dType: "String", presence: true},
          }
        }
      }
    )
  }

}
```

Now you can simply instantiate your contract like this:

```Javascript
const signUpContract = new SignupContract()
```

Accessing and assigning single values is pretty straight forward:

```Javascript
signUpContract.name = "Kirill"
signUpContract.address.street = "Uhlandstr. 36"

console.log(
  signUpContract.name
)

console.log(
  signUpContract.address.street
)
```

If the data is coming as JSON or as an nested Object
from your API or State Management System for example,
you can assign it like that:

```Javascript
signUpContract.assign({
  name: "Kirill",
  agb: true,
  email: "kirill@example.com",
  username: "kirill94",
  password: "secret-password",
  passwordRepeat: "secret-password",
  address: {
    street: "Uhlandstr.",
    streetNumber: 36,
    plz: "10437",
    city: "Berlin"
  }
})
```

Inherit from your base class and define your contracts! Have Fun!

# Documentation

- [Changelog](CHANGELOG.md)
- [Installation & Getting Started](doc/getting_started.md)
- [General Usage](doc/general_usage.md)
- [TypeScript](doc/typescript.md)
  - [Type Inference](doc/typescript.md#type-inference)
- [Configuration](doc/configuration.md)
- [API](doc/api.md)
  - [Hooks](doc/api.md#hooks)
  - [Inheritance](doc/api.md#inheritance)
- [Schema](doc/schema.md)
  - [Schema Linting](doc/schema.md#schema-linting)
- [Mixed type Arrays](doc/mixed_type_arrays.md)
- [Validation](doc/validation.md)
    - [Breaker](doc/validation.md#validation-breakers)
        - [allowBlank](doc/validation/allowBlank.md)
        - [validateIf](doc/validation/validateIf.md)
        - [on (validation context)](doc/validation/on.md)
    - [Normal Validation](doc/validation.md#normal-validations)
        - [dType](doc/validation/dType.md)
        - [presence](doc/validation/presence.md)
        - [absence](doc/validation/absence.md)
        - [only](doc/validation/only.md)
        - [strictOnly](doc/validation/strictOnly.md)
        - [min](doc/validation/min.md)
        - [max](doc/validation/max.md)
        - [isEmail](doc/validation/isEmail.md)
        - [match](doc/validation/match.md)
    - [Custom Validation](doc/validation/validate.md)
    - [Additional Validations](doc/validation/additionalValidations.md)
- [Localization](doc/localization.md)
    - [i18next](doc/localization.md#i18next)
    - [Custom Localization](doc/localization.md#custom-localization-method)
    - [Custom Error Messages](doc/localization.md#custom-error-messages)
    - [Automatic Message Translation](doc/localization.md#automatic-message-translation)



# Validation Context

It is possible to do validations only if a specific context is set.
It is a quality of life feature and could also be implemented through validateIf.

```Javascript
class SubContextContract extends ContractBase {

  defineSchema() {
    return (
      {
        ...super.defineSchema(),
        ...{
          numberWithoutContext: {dType: "Number", min: 10},
          number: {dType: "Boolean", only: true, on: "contextA"}
        }
      }
    )
  }

}

class ContextContract extends ContractBase {
  defineSchema() {
    return (
      {
        ...super.defineSchema(),
        ...{
          numberWithoutContext: {dType: "Number", min: 10},
          number: {dType: "Number", min: 10, on: "contextA"},
          string: {dType: "String", match: /^[a-zA-Z0-9\s]*$/, on: ["contextA", "contextB"]},
          addressSimple: {
            plz: {presence: true, dType: "String", on: "contextA"}
          },
          sub: {dType: "Contract", contract: SubContextContract, allowBlank: false, on: "contextB"},
          addressesContracted: {dType: "Array", min: 2, arrayOf: SubContextContract, allowBlank: false, on: "contextB"}, // this context will skip only outer validations like "min: 2" in this example
          subsContractedWithInner: {dType: "Array", min: 3, arrayOf: SubContextContract, allowBlank: false, on: "contextB", innerValidate: {on: "contextB"}} // use innerValidate to skip validations of nested contract
        }
      }
    )
  }
}
```

As you can see, every attribute can have one or more contexts through `on` attribute.
The context will also be passed to the nested contracts.

```Javascript
const contextContract = new ContextContract()
contextContract.assign(data)
contextContract.isValid("contextA") // context will be set to contextA
contextContract.isValid(["contextA", "contextB"]) // use multiple contexts
contextContract.isValid() // context = undefined
contextContract.isValid("matchAnyContext") // magic context to match all contexts
```

## Roadmap

Heimdall Contract is feature complete for its core mission. On the way to 1.0:

- [ ] battle testing the strict schema linting and type inference in real projects
- [ ] freezing the public API (validation semantics and the errors object shape are already documented as intended)

Ideas beyond 1.0:

- typed `assign()` input
- a helper for flattening the errors object into a list of `{path, messages}` entries

All notable changes are tracked in the [Changelog](CHANGELOG.md).

## Contributing

1. Fork it (<https://github.com/ikaru5/heimdall-contract/fork>)
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create a new Pull Request

## Contributors and Contact

If you have ideas on how to develop heimdall or what features it is missing, I would love to hear about it!

- [@ikaru5](https://github.com/ikaru5) Kirill Kulikov - creator, maintainer

## Copyright

Copyright (c) 2025 Kirill Kulikov <k.kulikov94@gmail.com>

`heimdall-contract` is released under the [MIT License](http://www.opensource.org/licenses/MIT).