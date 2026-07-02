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
The available types are "String", "Number", "Boolean", "Generic", "Array", and "Contract".

Another magic field is errors at the root level of any contract. It will be written by calling the [validations](validation.md).

**Attention**: Another limitation is that you can not use the errors property as a field name at the root of a contract.

**Attention**: The key `messages` is reserved inside the errors object: it always holds the array of error messages of a field (or the outer messages of an array field, next to the numeric element keys). A field named `messages` would make its error object ambiguous, so avoid `messages` as a field name.

All [validations](validation.md) are mixed within the schema object. Also, custom validation can be defined.

### Unknown field definition keywords

Schema problems are programming errors, so by default Heimdall lints the schema and throws a `SchemaError` (see [Schema Linting](#schema-linting)) when a field definition contains an unknown keyword - most of the time this is a typo like `presense` instead of `presence`.

If you want to use custom keywords in the schema for other purposes, there are two supported ways:

- Enable the [ignoreUnderscoredFields](configuration.md) option and prefix your keywords with an underscore (like "_label" or "_placeholder"). They are then fully ignored by assignment, validation and rendering. This is handy if you want to use the schema to generate forms for example.
- Disable strict linting with `strictSchema: false` (see [Configuration](configuration.md)). Unknown keywords are then ignored by the logic and only reported to the console.

## Schema Linting

Heimdall checks your schema in two phases and collects all problems of a phase into a single `SchemaError`:

1. `Structure` - checked when the contract is constructed: valid dTypes, `arrayOf` present and valid on Array fields, `contract` present and valid on Contract fields, schema nodes are objects, `validate`/`validateIf` are functions. Inline schemas inside `arrayOf` and `contract` are checked as well.
2. `Keywords` - checked on the first `isValid()` call: every keyword of a field definition must be a known validation. This can not happen at construction time, because [additional validations](validation/additionalValidations.md) may be inherited from a parent contract, which are only known at validation time.

```Javascript
import ContractBase, {SchemaError} from "@ikaru5/heimdall-contract"

try {
  const contract = new ContractBase({schema: {name: {dType: "Strng"}}})
} catch (error) {
  error instanceof SchemaError // true
  error.problems // ['invalid dType "Strng" at "name"']
}
```

In strict mode (the default) a `SchemaError` is thrown. With `strictSchema: false` the same message is written to the console instead and the offending parts of the schema are ignored - see [Configuration](configuration.md).

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