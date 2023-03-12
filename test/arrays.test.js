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
})