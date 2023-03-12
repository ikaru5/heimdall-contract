import {describe, expect, it} from '@jest/globals';
import ContractBase from "../../index.js"

describe("strictOnly validation", () => {
  class TestContract extends ContractBase {
    defineSchema() {
      return (
        {
          ...super.defineSchema(),
          ...{
            valueA: {dType: "String", strictOnly: "only valid value"},
            valueB: {dType: "String", strictOnly: ["Tim", "Tom"]},
            valueC: {dType: "Array", strictOnly: ["Tim", "Tom"]},
            valueD: {dType: "Array", strictOnly: () => ["Tim"]},
            valueE: {dType: "String", strictOnly: ["Tim"]},
          }
        }
      )
    }
  }

  it('validates with valid values', () => {
    const testContract = new TestContract()
    testContract.valueA = "only valid value"
    testContract.valueB = "Tim"
    testContract.valueC = ["Tim", "Tom"]
    testContract.valueD = ["Tim"]
    testContract.valueE = "Tim"
    expect(testContract.isValid()).toBe(true)
    expect(testContract.errors).toStrictEqual({})

    // empty values ale also valid
    testContract.valueA = ""
    testContract.valueB = undefined // undefined is also valid for only, but not for dType
    testContract.valueC = []
    testContract.valueD = ["Tim", "Tom", "Tim", "Tom"]
    testContract.valueE = ""
    expect(testContract.isValid()).toBe(false)
    expect(testContract.errors).toStrictEqual({
      valueB: {messages: ['"undefined" is not a valid String']},
      valueD: {messages: ['must be "Tim"']},
    })
  })

  it('validates with invalid values', () => {
    const testContract = new TestContract()
    testContract.valueA = "only invalid value"
    testContract.valueB = "Tina"
    testContract.valueC = ["Tina"]
    testContract.valueD = ["Tina"]
    testContract.valueE = "Tina"
    expect(testContract.isValid()).toBe(false)
    expect(testContract.errors).toStrictEqual({
      valueA: {messages: ['must be "only valid value"']},
      valueB: {messages: ['must be "Tim" or "Tom"']},
      valueC: {messages: ['must be "Tim,Tom"']},
      valueD: {messages: ['must be "Tim"']},
      valueE: {messages: ['must be "Tim"']},
    })
  })
})