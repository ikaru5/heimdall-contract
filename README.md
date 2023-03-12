# Heimdall Contract (WIP)

Validation Objects in your Frontend
Target is to create Contracts (Reform) like Ruby Trailblazer for your JS-Frontend like React, Vue or any other JS project.

This is still in development... More to come!

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
              // custom validation translation is not implemented yet, so you have to return the error message in the language you want to display it
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
signUpContract.name = "Kirill"
signUpContract.address.street = "Uhlandstr. 36"

console.log(
  signUpContract.name
)

console.log(
  signUpContract.address.street
)
```

# Validation Context

It is possible to do validations only if a specific context is set.
It is a quality o life feature and could also be implemented through validateIf.

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

## Development

- [ ] add example for i18next
- [ ] validation modes: validate all (default), stop on first error, stop on first error per attribute
- [ ] write README :D

## Contributing

1. Fork it (<https://github.com/your-github-user/schemas/fork>)
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create a new Pull Request

## Contributors and Contact

If you have ideas on how to develop heimdall or what features it is missing, I would love to hear about it!

- [@ikaru5](https://github.com/ikaru5) Kirill Kulikov - creator, maintainer

## Copyright

Copyright (c) 2020 Kirill Kulikov <k.kulikov94@gmail.com>

`heimdall-contract` is released under the [MIT License](http://www.opensource.org/licenses/MIT).