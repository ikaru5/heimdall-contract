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
      fields: {
        mixedSimpleTypeValues: {
          elements: {
            "0": {issues: [{validation: "min", message: "must be greater than or equal to 3"}]},
            "1": {issues: [{validation: "min", message: "must have at least 3 characters"}]}
          }
        },
        addressesContracted: {
          elements: {
            "0": {
              fields: {
                city: {issues: [{validation: "presence", message: "not present"}]},
                plz: {issues: [{validation: "presence", message: "not present"}]},
                streetNumber: {
                  issues: [
                    {validation: "presence", message: "not present"},
                    {validation: "dType", message: "\"1\" is not a valid Number"}
                  ]
                }
              }
            },
            "2": {
              fields: {
                city: {issues: [{validation: "presence", message: "not present"}]},
                plz: {issues: [{validation: "presence", message: "not present"}]},
                streetNumber: {
                  issues: [
                    {validation: "presence", message: "not present"},
                    {validation: "dType", message: "\"null\" is not a valid Number"}
                  ]
                }
              }
            }
          }
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

  it('should use default empty value when assign null/undefined to string-type array', () => {
    class TestContractWithNullInArray extends ContractBase {
      defineSchema() {
        return {
          ...super.defineSchema(),
          ...{
            names: {dType: "Array", arrayOf: "String"},
            ages: {dType: "Array", arrayOf: "Number"},
          }
        }
      }
    }

    const contract = new TestContractWithNullInArray()
    contract.assign({names: ["Alice", null, undefined, "Bob"], ages: [25, null, undefined, 30]})

    expect(contract.names).toStrictEqual(["Alice", "", "", "Bob"])
    expect(contract.ages).toStrictEqual([25, null, null, 30])
    expect(contract.isValid()).toBe(true)
  })

  it('should preserve falsy values (0, false, empty string) when assigning arrays', () => {
    class TestContractWithFalsyValues extends ContractBase {
      defineSchema() {
        return {
          ...super.defineSchema(),
          ...{
            numbers: {dType: "Array", arrayOf: "Number"},
            flags: {dType: "Array", arrayOf: "Boolean"},
            words: {dType: "Array", arrayOf: "String"},
            mixed: {dType: "Array", arrayOf: ["Number", "Boolean"]},
          }
        }
      }
    }

    const contract = new TestContractWithFalsyValues()
    contract.assign({numbers: [0, 1], flags: [false, true], words: ["", "x"], mixed: [0, false, 1]})

    expect(contract.numbers).toStrictEqual([0, 1])
    expect(contract.flags).toStrictEqual([false, true])
    expect(contract.words).toStrictEqual(["", "x"])
    expect(contract.mixed).toStrictEqual([0, false, 1])
    expect(contract.isValid()).toBe(true)
  })

  it('should not throw and report a dType error when an array field is null', () => {
    const contract = new ArrayedContract()
    contract.numbers = null

    expect(() => contract.isValid()).not.toThrow()
    expect(contract.isValid()).toBe(false)
    expect(contract.errors).toStrictEqual({fields: {numbers: {issues: [{validation: "dType", message: "\"null\" is not a valid Array"}]}}})
  })

  it('should treat null/undefined elements of a contract array as empty contracts instead of throwing', () => {
    class ItemContract extends ContractBase {
      defineSchema() {
        return {
          ...super.defineSchema(),
          ...{name: {dType: "String", presence: true}}
        }
      }
    }

    class ListContract extends ContractBase {
      defineSchema() {
        return {
          ...super.defineSchema(),
          ...{items: {dType: "Array", arrayOf: ItemContract}}
        }
      }
    }

    // direct assignment
    const contract = new ListContract()
    contract.items = [null, undefined, {name: "Alice"}]
    expect(() => contract.isValid()).not.toThrow()
    expect(contract.isValid()).toBe(false)
    expect(contract.errors).toStrictEqual({
      fields: {
        items: {
          elements: {
            "0": {fields: {name: {issues: [{validation: "presence", message: "not present"}]}}},
            "1": {fields: {name: {issues: [{validation: "presence", message: "not present"}]}}}
          }
        }
      }
    })
    expect(contract.items[0].isAssignedEmpty).toBe(true) // same behavior as assign() with null

    // via assign
    const assignedContract = new ListContract()
    assignedContract.assign({items: [null, {name: "Alice"}]})
    expect(assignedContract.isValid()).toBe(false)
    expect(assignedContract.errors).toStrictEqual({
      fields: {
        items: {elements: {"0": {fields: {name: {issues: [{validation: "presence", message: "not present"}]}}}}}
      }
    })
  })

  it('should not throw when a mixed contract array receives null elements', () => {
    class TypedItemContract extends ContractBase {
      defineSchema() {
        return {
          ...super.defineSchema(),
          ...{name: {dType: "String"}}
        }
      }
    }

    class MixedListContract extends ContractBase {
      defineSchema() {
        return {
          ...super.defineSchema(),
          ...{items: {dType: "Array", arrayOf: [TypedItemContract]}}
        }
      }
    }

    // via assign: null is reported to the console and becomes an empty contract
    console.error.mockClear()
    const assignedContract = new MixedListContract()
    expect(() => assignedContract.assign({items: [null, {name: "Alice", arrayElementType: "TypedItemContract"}]})).not.toThrow()
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("Array of objects must be an array of objects!"))
    expect(() => assignedContract.isValid()).not.toThrow()

    // direct assignment
    const contract = new MixedListContract()
    contract.items = [null]
    expect(() => contract.isValid()).not.toThrow()
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

  it('matches mixed array element types by static typeName with class-name fallback', () => {
    class NoteElementContract extends ContractBase {
      static typeName = "Note"

      defineSchema() {
        return (
          {
            ...super.defineSchema(),
            ...{
              arrayElementType: {dType: "String"},
              text: {dType: "String", presence: true}
            }
          }
        )
      }
    }

    class LinkElementContract extends ContractBase {
      defineSchema() {
        return (
          {
            ...super.defineSchema(),
            ...{
              arrayElementType: {dType: "String"},
              url: {dType: "String", presence: true}
            }
          }
        )
      }
    }

    class AttachmentsContract extends ContractBase {
      defineSchema() {
        return (
          {
            ...super.defineSchema(),
            ...{
              attachments: {dType: "Array", arrayOf: [NoteElementContract, LinkElementContract]}
            }
          }
        )
      }
    }

    const contract = new AttachmentsContract()
    const input = {
      attachments: [
        {arrayElementType: "Note", text: "stable across minification"}, // static typeName
        {arrayElementType: "LinkElementContract", url: "https://example.com"} // class-name fallback
      ]
    }
    contract.assign(input)

    expect(contract.toObject()).toStrictEqual(input)
    expect(contract.isValid()).toBe(true)

    // the resolved class validates the element: a Note without text must fail
    contract.attachments = [{arrayElementType: "Note", text: ""}]
    expect(contract.isValid()).toBe(false)
    expect(contract.errorsAt("attachments.0.text").issues[0].validation).toBe("presence")
  })

  it('drops stale trailing elements when a shorter array is assigned', () => {
    class ReassignContract extends ContractBase {
      defineSchema() {
        return (
          {
            ...super.defineSchema(),
            ...{
              numbers: {dType: "Array", arrayOf: "Number"},
              objects: {
                dType: "Array",
                arrayOf: {
                  name: {dType: "String"}
                }
              }
            }
          }
        )
      }
    }

    const contract = new ReassignContract()
    contract.assign({numbers: [1, 2], objects: [{name: "a"}, {name: "b"}]})
    contract.assign({numbers: [3], objects: [{name: "c"}]})

    expect(contract.toObject()).toStrictEqual({numbers: [3], objects: [{name: "c"}]})

    contract.assign({numbers: [], objects: []})

    expect(contract.toObject()).toStrictEqual({numbers: [], objects: []})
  })
})
