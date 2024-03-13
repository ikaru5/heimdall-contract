[back to root](../README.md#Documentation)

# Mixed type Arrays

If you want to define an array that can contain different types of elements, you can use the `arrayOf` property and provide an array of types.

## Note

To make this work for Array of Contracts, heimdall will need a property "arrayElementType" in the schema of the sub-contract.
Define it like this: `arrayElementType: {dType: "String", presence: true}`

You will also need to set it inside your input object on assignment. It will also be rendered in the output object when calling toObject().

### Note about inline Contracts as Type
They are not implemented yet. Not sure if they ever will be.

Example:

```Javascript
{
  ...super.defineSchema(),
  ...{
    mixedSimpleTypeValues: {
      dType: "Array",
        arrayOf: ["String", "Number"],
        min: 3,
        presence: true,
        innerValidate: {presence: true, min: 3, allowBlank: false},
      allowBlank: false
    },
    addressesContracted: {dType: "Array", min: 3, arrayOf: [PrivateAddressContract, BusinessAddressContract], allowBlank: false},
  }
}
```