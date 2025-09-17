[back to root](../README.md#Documentation)

# API

An instance of a contract has the following methods and properties:

| Method/Property      | Type              | Description                                                                                                                                                      |
|----------------------|-------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| assign(data: object) | instance method   | This method is used to assign data to the contract. The data should be an object that matches the schema. Keywords which do not match the schema will be ignored |
| toObject()           | instance method   | This method will return an object with values according to the defined schema. Can be used to create clean JSON without the contract stuff.                      |
| isValid()            | instance method   | This method is used to check if the current state of the contract is valid according to the schema. Fills in `errors` property. Returns boolean.                 |
| errors               | instance property | This property contains the error messages for all failed validations. Is created after calling isValid().                                                        |

## Schema Configuration Options

Beyond validation rules, the schema supports several configuration options for field mapping and transformation:

| Configuration | Type            | Description                                                                                                                                |
|---------------|-----------------|--------------------------------------------------------------------------------------------------------------------------------------------|
| parseAs       | string or array | Controls which input keys are used when parsing/assigning data. Allows mapping from external field names to internal property names.     |
| renderAs      | string or array | Controls which output keys are used when rendering via `toObject()`. Allows mapping from internal property names to external field names. |
| as            | string or array | Fallback for both `parseAs` and `renderAs`. Used for both input parsing and output rendering if specific options are not provided.       |

### parseAs

The `parseAs` option allows you to specify alternative field names for input data when calling `assign()`. This is useful when your internal contract property names differ from the external API field names you receive.

**Priority:** `parseAs` > `as` > property name

**Examples:**

```Javascript
// Basic usage
class UserContract extends ContractBase {
  defineSchema() {
    return {
      name: {dType: "String", parseAs: "full_name"},
      email: {dType: "String", parseAs: "email_address"}
    }
  }
}

const user = new UserContract()
user.assign({
  full_name: "John Doe",    // maps to user.name
  email_address: "john@example.com"  // maps to user.email
})

console.log(user.name)  // "John Doe"
console.log(user.email) // "john@example.com"
```

**Array support for multiple fallbacks:**

```Javascript
class UserContract extends ContractBase {
  defineSchema() {
    return {
      name: {dType: "String", parseAs: ["full_name", "display_name", "username"]}
    }
  }
}

const user = new UserContract()
// Will use the first available key in priority order
user.assign({display_name: "Jane Doe"})
console.log(user.name)  // "Jane Doe"
```

### renderAs

The `renderAs` option allows you to specify alternative field names for output data when calling `toObject()`. This is useful when your internal contract property names need to be transformed to match external API expectations.

**Priority:** `renderAs` > `as` > property name

**Examples:**

```Javascript
// Basic usage  
class UserContract extends ContractBase {
  defineSchema() {
    return {
      name: {dType: "String", renderAs: "full_name"},
      email: {dType: "String", renderAs: "email_address"}
    }
  }
}

const user = new UserContract()
user.name = "John Doe"
user.email = "john@example.com"

console.log(user.toObject())
// Output: {full_name: "John Doe", email_address: "john@example.com"}
```

**Array support (uses first element):**

```Javascript
class UserContract extends ContractBase {
  defineSchema() {
    return {
      name: {dType: "String", renderAs: ["full_name", "display_name"]}
    }
  }
}

const user = new UserContract()
user.name = "Jane Doe"

console.log(user.toObject())
// Output: {full_name: "Jane Doe"} - uses first element of array
```

### Combining parseAs and renderAs

You can use both options together to create different mappings for input and output:

```Javascript
class UserContract extends ContractBase {
  defineSchema() {
    return {
      name: {dType: "String", parseAs: "input_name", renderAs: "output_name"}
    }
  }
}

const user = new UserContract()
user.assign({input_name: "John Doe"})  // input uses parseAs
console.log(user.toObject())           // output: {output_name: "John Doe"}
```

### Using with 'as' fallback

The `as` option provides a fallback for both parsing and rendering when specific options aren't provided:

```Javascript
class UserContract extends ContractBase {
  defineSchema() {
    return {
      // Uses 'as' for both input and output
      name: {dType: "String", as: "user_name"},
      
      // parseAs overrides 'as' for input, 'as' used for output  
      email: {dType: "String", as: "user_email", parseAs: "email_addr"},
      
      // renderAs overrides 'as' for output, 'as' used for input
      phone: {dType: "String", as: "user_phone", renderAs: "phone_number"}
    }
  }
}
```

## Inheritance

Inheriting a contract is pretty straight forward. Just use the `extends` keyword and you are good to go.

There is no magical schema merging or anything like that, so you have to merge the schemas yourself the way you want it.

Example:

```Javascript
defineSchema() {
  return (
    {
      ...super.defineSchema(),
      ...{ valueA: {dType: "String"} }
    }
  );
}
```

## Hooks

To effectively use inheritance and nested contracts there are a few hooks available:

### init

The init hook is typically used for setting up initial state or 
configurations when a new instance of a contract is created. 
It is called by the constructor of the contract and is used as replacement since you should not override the constructor.

Example:

```Javascript
init() {
  this.valueA = "Hello World";
}
```

### initNested

This hook defines a method which will be passed to nested contracts
and will be called by the nested contract's constructor.

This might be helpful if you want different behavior or initial state for contracts
depending on whether they are used as nested contracts or not.

Example:

```Javascript
class TestContractNested extends ContractBase {
  defineSchema() {
    return { valueA: {dType: "String"} }
  }

  initNested() {
    this.someProp = "Hello World Nested"
  }
}

class TestContract extends ContractBase {
  defineSchema() {
    return { nested: {dType: TestContractNested} }
  }
  
  initNested() {
    this.someProp = "Hello World Base"
  }
}

const testContract = new TestContract()
testContract.assign({ valueA: { valueA: "some valid value" } })
testContract.isValid() // true
testContract.nested.someProp // "Hello World Base"
testContract.someProp // undefined
```
### initAll

This hook defines a method which will be called by the constructor of the contract and all nested contracts.

This way you can pass down initial state or configurations to all nested contracts.

Example:

```Javascript
class TestContractNested extends ContractBase {
  defineSchema() {
    return { valueA: {dType: "String"} }
  }

  initAll() {
    this.someProp = "Hello World Nested"
  }
}

class TestContract extends ContractBase {
  defineSchema() {
    return { nested: {dType: TestContractNested} }
  }
  
  initAll() {
    this.someProp = "Hello World Base"
  }
}

const testContract = new TestContract()
testContract.assign({ valueA: { valueA: "some valid value" } })
testContract.isValid() // true
testContract.nested.someProp // "Hello World Base"
testContract.someProp // "Hello World Base"
```

[back to root](../README.md#Documentation)