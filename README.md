# Heimdall Contract (WIP)

Validation Objects in your Frontend
Target is to create Contracts like in Ruby Trailblazer for your JS-Frontend like React, Vue or similar.

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
          name: { dType: "String", presence: true },
          agb: { dType: "Boolean" , default: false, only: true },
          email: { dType: "String", presence: true, isEmail: true },
          username: { dType: "String", presence: true, min: 8 },
          password: { dType: "String", presence: true, min: 8 },
          passwordRepeat: {
            dType: "String", presence: true,
            validate: (value, contract) => {
              return value === contract.password ? true : false
            }
          },
          address: {
            street: { dType: "String", presence: true },
            streetNumber: { dType: "Number", presence: true },
            plz: { dType: "String", presence: true },
            city: { dType: "String", presence: true },
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

## Development

- [ ] add more tests
- [ ] add new dType: "StringNumber" for stringed numbers
- [ ] make dType validation skipable
- [ ] write README :D

## Contributing

1. Fork it (<https://github.com/your-github-user/schemas/fork>)
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create a new Pull Request

## Contributors and Contact

If you have ideas on how to develop heimdall more or what features it is missing, I would love to hear about it!

- [@ikaru5](https://github.com/ikaru5) Kirill Kulikov - creator, maintainer

## Copyright

Copyright (c) 2020 Kirill Kulikov <k.kulikov94@gmail.com>

`heimdall-constract` is released under the [MIT License](http://www.opensource.org/licenses/MIT).