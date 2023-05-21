[back to root](../README.md#Documentation)

# Schema

The schema is defined by overriding the defineSchema method in your contract class.
The defineSchema method returns the schema which is represented as an object, where each key corresponds to a property in the data and the value defines the validation rules for that property.


Complex Example:

```Javascript
{
  ...super.defineSchema(),
  ...{
    email: {dType: "String", presence: true, isEmail: true, allowBlank: false},
    username: {dType: "String", presence: true, min: 8, allowBlank: false},
    password: {dType: "String", presence: true, min: 8, allowBlank: false},
    passwordRepeat: {
      dType: "String", presence: true,
        validate: (value, contract) => {
        return value === contract.password ? true : "errors:passwordsNotMatching"
      }
    },
    agb: {
      dType: "Boolean", default: false, only: true, errorMessage: "errors:mustBeAccepted",
        validateIf: (value, contract) => !contract.allowBlank
    },
    addressSimple: {
      street: {dType: "String", presence: true},
      streetNumber: {presence: true, dType: "Number"},
      plz: {presence: true, dType: "String"},
      city: {dType: "String", presence: true},
    },
    names: {
      dType: "Array",
        arrayOf: "String",
        min: 3,
        presence: true,
        innerValidate: {presence: true, min: 3, allowBlank: false},
      allowBlank: false
    },
    address: {dType: "Contract", contract: AddressContract, allowBlank: false},
    addressesContracted: {dType: "Array", min: 3, arrayOf: AddressContract, allowBlank: false},
    addressesContractedWithin: {
      dType: "Array", min: 3, arrayOf: {
        street: {dType: "String", presence: true},
        streetNumber: {presence: true, dType: "Number"},
        plz: {presence: true, dType: "String"},
        city: {dType: "String", presence: true}
      }
    },
  }
}
```

## Schema Properties

As you can see, the whole field definition is defined in an object.
Whether it is a field definition is determined by the presence of the dType property.

**Attention**: So an important limitation is that you can not use the dType property as a field name.

### [dType](validation/dType.md)
dType is a normal validation and it defines the expected data type of the property. 
The available types are "String", "Number", "Boolean", "Array", "Object", and "Contract".

Another magic field is errors at the root level of any contract. It will be written by calling the [validations](validation.md).

**Attention**: Another limitation is that you can not use the errors property as a field name at the root of a contract.

All [validations](validation.md) are mixed within the schema object. Also, custom validation can be defined.

### Unknown field definition keywords

If you define a field definition with a keyword that is not known to the schema, it will be ignored by the logic. 
But an error will be written to the console. 

This is a feature to make the schema more flexible and to be able to use it for other purposes. 
For example, you can use the schema to generate a form and fields like "_label" or "_placeholder" can be helpful.

An example of a generator will be linked in the future.

## Nesting

Any object value without a dType property is considered a nested object.

There are two types of nesting:

1. `Object Nesting`: If a property is an object, you can provide a nested schema for it. 
The nested schema should be an object where each key represents a property in the nested object, 
and the value defines the validation rules for that property.

Example: 

```Javascript
{
  ...super.defineSchema(),
  ...{
    address: {
      street: {dType: "String", presence: true},
      streetNumber: {presence: true, dType: "Number"},
      plz: {presence: true, dType: "String"},
      city: {dType: "String", presence: true},
    }
  }
}
```

In this example, the address property is an object, and a nested schema is provided to validate the properties of the address object.

2. `Contract Nesting`: If a property is an object that should match a specific contract, you can specify the contract using the contract rule.

Example: 

```Javascript
{
  ...super.defineSchema(),
  ...{
    address: {dType: "Contract", contract: AddressContract, allowBlank: false} // allowBlank is optional, but might be useful
  }
}
```

## Arrays

A bit mor magic is required for arrays. The `dType` is simply "Array", 
but you have to specify the type of the array elements using the `arrayOf` property.

There are two types of array elements:

1. `Array of Primitives`: If the array should contain elements of a specific primitive type (e.g., strings, numbers), you can use the `arrayOf` rule and provide the type as a string..

Example: 

```Javascript
{
  ...super.defineSchema(),
  ...{
    names: {
      dType: "Array",
      arrayOf: "String",
      min: 3,
      presence: true,
      innerValidate: {presence: true, min: 3, allowBlank: false},
      allowBlank: false
    }
  }
}
```

AS you can see, the `innerValidate` property is used to define the validation rules for the array elements. 
All other rules are applied to the array itself.

2. `Array of Objects or Contracts`: If the array should contain objects that match a specific schema or contract, you can use the `arrayOf` keyword and provide the schema or contract.

Example: 

```Javascript
{
  ...super.defineSchema(),
  ...{
    addressesContracted: {dType: "Array", min: 3, arrayOf: AddressContract, allowBlank: false},
    addressesContractedWithin: {
      dType: "Array", min: 3, arrayOf: {
        street: {dType: "String", presence: true},
        streetNumber: {presence: true, dType: "Number"},
        plz: {presence: true, dType: "String"},
        city: {dType: "String", presence: true}
      }
    },
  }
}
```

[back to root](../README.md#Documentation)