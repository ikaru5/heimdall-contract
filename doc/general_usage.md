[back to root](../README.md#Documentation)

## General Usage

This library provides a class-based value holder called Contract. It supports nested values, validation, and localization. The primary purpose of this library is to validate and manage data according to predefined schemas.

### Usage

1. Import the Contract class from the library:

```javascript
import { ContractBase } from "@ikaru5/heimdall-contract";
```

Note: Most if the time you want to use your own base class that extends and configures the Heimdall Contract class. 
So all your contracts use the same localization method on the validation messages for example.
See [Configuration](doc/configuration.md) for more information.

So we assume you have a base class and you import it like this:

```javascript
import Contract from "../contract";
```

2. Create a contract class that inherits from the base class:

```javascript
class UserContract extends Contract {
  defineSchema() {
    return (
      {
        ...super.defineSchema(), // This is redundant here since we inherit from base class which has an empty schema, but might be important if you extend your class.
        ...{
          id: { dType: "Number", presence: true, on: "update" },
          email: { dType: "String", presence: true, isEmail: true, on: ["update", "signup"] },
          emailOrUsername: { dType: "String", presence: true, min: 6, on: ["login"] },
          username: { dType: "String", presence: true, min: 6, on: ["update", "signup"] },
          password: { dType: "String", presence: true, min: 8, on: ["login", "signup"] },
          passwordRepeat: { dType: "String", presence: true,
            validate: (value, contract) => {
              return value === contract.password ? true : [false, i18n.t("errors:passwordsNotMatching")]
            },
            on: "signup"
          },
          agb: { dType: "Boolean", default: false, only: true, on: "signup" },
        }
      }
    )
  }
}
```

As you can see, the `defineSchema` method returns an object that defines the structure and validation rules for your data. 
For more information about the schema definition, see [Schema](doc/schema.md).

In your contract class, you can define methods for your needs. For example, you can define a decorator method that returns the user's full name or a method for validating and sending the data to the server.

Also it is the place to define hooks. For more information about hooks, see [Hooks](doc/api.md#hooks).



### Creating a Contract Instance

To create a contract instance, you just need to import the `WhateverYouNeedContract` class and instantiate it.

```javascript
import { userContract } from '../contracts/userContract';

const userContract = new userContract();
```

### Alternative: Creating a Contract dynamically, only with a schema

You do not need to create a class that extends the base class. You can also create a contract instance directly from a schema.
It is a good way if your schema is defined dynamically through a JSON file for example.

```javascript
const userSchema = {
  id: { dType: "Number", presence: true, on: "update" },
  // ... and so on
}

// if you want to use your base class
import Contract from "../contract"
const userContract = new Contract({schema: userSchema})

// or if you want to use the base class from this library
import { ContractBase } from "@ikaru5/heimdall-contract"
const userContract = new ContractBase({schema: userSchema})
```

### Alternative: Creating a Contract class with the contractClass factory

If you want a reusable contract class without writing the class boilerplate, use the `contractClass` factory.
It returns a regular contract class: instantiate it, extend it, nest it via `dType: "Contract"` or `arrayOf` - everything works like with a handwritten class.
For TypeScript users the returned class additionally carries typed fields inferred from the schema (see [Type Inference](typescript.md#type-inference)).

```javascript
import { contractClass } from "@ikaru5/heimdall-contract"

const UserContract = contractClass({
  email: { dType: "String", presence: true, isEmail: true },
  username: { dType: "String", presence: true, min: 6 },
})

const userContract = new UserContract()
```

You can pass a base class as second argument - its schema, hooks and additional validations are inherited and the given schema is merged on top:

```javascript
const EmployeeContract = contractClass({ staffId: { dType: "Number", presence: true } }, UserContract)
```

### Assigning Data

To assign data to the contract instance, use the `assign` method. 
Or you can simply assign the data directly, but then you will need to create the nested structures yourself.
Additionally, the assign method will assign only according to the schema. So if your input data has fields, which are not in the schema, they will be ignored.

```javascript
const userData = {
  name: "John Doe",
  email: "john.doe@example.com",
  age: 25
}

userContract.assign(userData)

// or directly
userContract.id = 1234
userContract.email = "some@some.com"
```

### Validating Data

To validate data against the schema, use the `isValid` method on the contract instance. 
It returns a boolean value and sets the `errors` property on the contract instance. Also, it will set the `isValidState` property on the contract instance.

```javascript
const isValidState = userContract.isValid()
// or 
userContract.isValid()
const isValidState = userContract.isValidState

// read the errors object
console.log(userContract.errors)
```

### Reading/Rendering assigned data

Reading is as simple as assigning data. Just read the properties of the contract instance or use the `toObject` method.

```javascript
console.log(userContract.toObject()) // equally as assigning data, it will return only the data according to the schema

// or
console.log(userContract.id)
console.log(userContract.email)
```

That's it! You've successfully defined a schema, created a contract instance, and validated data against the schema. The following chapters will cover more advanced topics and configuration options.

[back to root](../README.md#Documentation)