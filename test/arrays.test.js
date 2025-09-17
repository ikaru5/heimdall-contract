import {describe, expect, it} from '@jest/globals';
import ContractBase from "../index.js"

describe("arrays", () => {
  class ArrayedContract extends ContractBase {
    defineSchema() {
      return (
        {
          ...super.defineSchema(),
          ...{
            numbers: {dType: "Array", arrayOf: "Number"},
            strings: {dType: "Array", arrayOf: "String"},
            objects: {
              dType: "Array",
              arrayOf: {
                number: {dType: "Number"},
                string: {dType: "String"}
              }
            }
          }
        }
      )
    }

  }

  it('can add new elements to contract with array', () => {
    const arrayedContract = new ArrayedContract()

    expect(arrayedContract.toObject()).toStrictEqual({numbers: [], strings: [], objects: []})

    arrayedContract.numbers = [1, 2, 3]
    arrayedContract.strings = ["1", "2", "3"]
    arrayedContract.objects = [{number: 1, string: "2"}, {number: 2, string: "3"}]

    let validObject = {
      numbers: [1, 2, 3],
      strings: ['1', '2', '3'],
      objects: [{number: 1, string: '2'}, {number: 2, string: '3'}]
    }

    expect(arrayedContract.toObject()).toStrictEqual(validObject)
    expect(arrayedContract.toObject()).toStrictEqual(validObject) // check it twice!

    arrayedContract.numbers.push(5)
    arrayedContract.strings.push("6")
    arrayedContract.objects.push({number: 4, string: "4"})

    validObject = {
      numbers: [1, 2, 3, 5],
      strings: ['1', '2', '3', '6'],
      objects: [{number: 1, string: '2'}, {number: 2, string: '3'}, {number: 4, string: "4"}]
    }

    expect(arrayedContract.toObject()).toStrictEqual(validObject)
    expect(arrayedContract.toObject()).toStrictEqual(validObject) // check it twice!

    expect(arrayedContract.isValid()).toBe(true)
    expect(arrayedContract.errors).toStrictEqual({})
  })

  class PrivateAddressContract extends ContractBase {
    defineSchema() {
      return (
        {
          ...super.defineSchema(),
          ...{
            arrayElementType: {dType: "String", presence: true},
            street: {dType: "String", presence: true},
            streetNumber: {presence: true, dType: "Number"},
            plz: {presence: true, dType: "String"},
            city: {dType: "String", presence: true}
          }
        }
      )
    }
  }

  class BusinessAddressContract extends ContractBase {
    defineSchema() {
      return (
        {
          ...super.defineSchema(),
          ...{
            arrayElementType: {dType: "String", presence: true},
            street: {dType: "String", presence: true},
            zip: {presence: true, dType: "String"},
            town: {dType: "String", presence: true}
          }
        }
      )
    }
  }

  class MixedTypeArrayContract extends ContractBase {
    defineSchema() {
      return (
        {
          ...super.defineSchema(),
          ...{
            mixedSimpleTypeValues: {
              dType: "Array",
              arrayOf: ["String", "Number", "Boolean", "Generic"],
              min: 3,
              presence: true,
              innerValidate: {presence: true, min: 3, allowBlank: false},
              allowBlank: false
            },
            addressesContracted: {dType: "Array", min: 3, arrayOf: [PrivateAddressContract, BusinessAddressContract], allowBlank: false},
          }
        }
      )
    }
  }

  it('can add new elements to contract with mixed type array', () => {
    const mixedTypeArrayContract = new MixedTypeArrayContract()
    expect(mixedTypeArrayContract.toObject()).toStrictEqual({
      mixedSimpleTypeValues: [],
      addressesContracted: []
    })

    const input = {
      mixedSimpleTypeValues: [5, "223", 3],
      addressesContracted: [
        {arrayElementType: "PrivateAddressContract", street: "street1", streetNumber: 1, plz: "12345", city: "city1"},
        {arrayElementType: "BusinessAddressContract", street: "street2", zip: "22345", town: "town2"},
        {arrayElementType: "PrivateAddressContract", street: "street3", streetNumber: 3, plz: "32345", city: "city3"}
      ]
    }

    mixedTypeArrayContract.assign(input)

    expect(mixedTypeArrayContract.toObject()).toStrictEqual(input)

    // test validation
    expect(mixedTypeArrayContract.isValid()).toBe(true)

    // test direct assignment
    mixedTypeArrayContract.mixedSimpleTypeValues = [1, "22", 3, true, {a: "b"}]
    mixedTypeArrayContract.addressesContracted = [
      {arrayElementType: "PrivateAddressContract", street: "street1", streetNumber: "1"},
      {arrayElementType: "BusinessAddressContract", street: "street2", zip: "22345", town: "town2"},
      {arrayElementType: "PrivateAddressContract", street: "street3", zip: "22345", town: "town2"}
    ]

    expect(mixedTypeArrayContract.toObject()).toStrictEqual({
      mixedSimpleTypeValues: [1, "22", 3, true, {a: "b"}],
      addressesContracted: [
        {arrayElementType: "PrivateAddressContract", street: "street1", streetNumber: "1", plz: "", city: ""},
        {arrayElementType: "BusinessAddressContract", street: "street2", zip: "22345", town: "town2"},
        {arrayElementType: "PrivateAddressContract", street: "street3", streetNumber: null, plz: "", city: ""}
      ]
    })

    // test validation errors
    expect(mixedTypeArrayContract.isValid()).toBe(false)

    expect(mixedTypeArrayContract.errors).toStrictEqual({
      "mixedSimpleTypeValues": {
        "0": { "messages": [ "must be greater than or equal to 3" ] },
        "1": { "messages": [ "must have at least 3 characters" ] }
      },
      "addressesContracted": {
        "0": { "city": { "messages": [ "not present" ] }, "plz": { "messages": [ "not present" ] }, "streetNumber": { "messages": [ "not present", "\"1\" is not a valid Number" ] } },
        "2": { "city": { "messages": [ "not present" ] }, "plz": { "messages": [ "not present" ] }, "streetNumber": { "messages": [ "not present", "\"null\" is not a valid Number" ] }
        }
      }
    })
  })

  it('should handle array assignment with mixed basic data types', () => {
    class TestContractMixedBasic extends ContractBase {
      defineSchema() {
        return {
          ...super.defineSchema(),
          ...{
            mixedBasic: {dType: "Array", arrayOf: ["String", "Number", "Boolean"]}
          }
        }
      }
    }

    const contract = new TestContractMixedBasic()
    // Directly assign array to trigger the specific branch condition
    contract.assign({mixedBasic: ["test", 123, true, null]})
    
    expect(contract.mixedBasic).toStrictEqual(["test", 123, true, null])
    expect(contract.isValid()).toBe(true)
  })

  it('should handle error condition when non-object passed to Contract array', () => {
    class TestContractForArray extends ContractBase {
      defineSchema() {
        return {
          name: {dType: "String"}
        }
      }
    }

    class TestContractWithError extends ContractBase {
      defineSchema() {
        return {
          ...super.defineSchema(),
          ...{
            contractArray: {dType: "Array", arrayOf: [TestContractForArray]}
          }
        }
      }
    }

    const contract = new TestContractWithError()
    // This should trigger the error condition on line 153 when non-object is passed
    contract.assign({contractArray: ["not an object", {name: "valid"}]})
    
    // The assignment should still work despite the error
    expect(Array.isArray(contract.contractArray)).toBe(true)
  })

})