import {describe, expect, it} from '@jest/globals';
import ContractBase from "../../index.js"

describe("absence validation", () => {
  class TestContract extends ContractBase {
    defineSchema() {
      return (
        {
          ...super.defineSchema(),
          ...{
            valueA: {dType: "String", absence: true},
            valueB: {dType: "String", absence: false},
            valueC: {dType: "String", absence: () => true},

            valueD: {dType: "Number", absence: true},
            valueE: {dType: "Boolean", absence: true},
            valueF: {dType: "Generic", absence: true},
            valueG: {dType: "Array", absence: true},
            valueH: {dType: "Array", absence: true}
          }
        }
      )
    }
  }

  it('validates with valid values', () => {
    const testContract = new TestContract()
    testContract.valueA = undefined
    testContract.valueB = "Some valid value"
    testContract.valueC = ""
    testContract.valueD = undefined
    testContract.valueE = undefined
    testContract.valueF = undefined
    testContract.valueG = undefined
    testContract.valueH = []
    expect(testContract.isValid()).toBe(false)
    expect(testContract.errors).toStrictEqual({
      valueA: {messages: ['"undefined" is not a valid String']},
      valueD: {messages: ['"undefined" is not a valid Number']},
      valueE: {messages: ['"undefined" is not a valid Boolean']},
      valueG: {messages: ['"undefined" is not a valid Array']},
    })
  })

  it('validates with invalid values', () => {
    const testContract = new TestContract()
    testContract.valueA = "Some invalid value"
    testContract.valueB = null
    testContract.valueC = "Some invalid value"
    testContract.valueD = 123
    testContract.valueE = false
    testContract.valueF = {doesnt: "matter"}
    testContract.valueG = [1]
    testContract.valueH = [2]
    expect(testContract.isValid()).toBe(false)
    expect(testContract.errors).toStrictEqual({
      valueA: {messages: ["must be absent"]},
      valueB: {messages: ['"null" is not a valid String']},
      valueC: {messages: ["must be absent"]},
      valueD: {messages: ["must be absent"]},
      valueE: {messages: ["must be absent"]},
      valueF: {messages: ["must be absent"]},
      valueG: {messages: ["must be absent"]},
      valueH: {messages: ["must be absent"]},
    })
  })
})