[back to root](../README.md#Documentation)

# API

An instance of a contract has the following methods and properties:

| Method/Property      | Type              | Description                                                                                                                                                      |
|----------------------|-------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| assign(data: object) | instance method   | This method is used to assign data to the contract. The data should be an object that matches the schema. Keywords which do not match the schema will be ignored |
| toObject()           | instance method   | This method will return an object with values according to the defined schema. Can be used to create clean JSON without the contract stuff.                      |
| isValid()            | instance method   | This method is used to check if the current state of the contract is valid according to the schema. Fills in `errors` property. Returns boolean.                 |
| errors               | instance property | This property contains the error messages for all failed validations. Is created after calling isValid().                                                        |

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
  )
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
  this.valueA = "Hello World"
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