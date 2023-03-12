import {describe, expect, it} from '@jest/globals';
import ContractBase from "../../index.js"

describe("dType validation", () => {
  class TestContract extends ContractBase {
    defineSchema() {
      return (
        {
          ...super.defineSchema(),
          ...{
            valueA: {dType: "String"},
            valueB: {dType: "Number"},
            valueC: {dType: "Boolean"},
            valueD: {dType: "Generic"},
            valueE: {dType: "Array"},
            valueF: {dType: "Invalid"},
          }
        }
      )
    }
  }

  it('validates with valid value', () => {
    const testContract = new TestContract()
    testContract.valueA = "Some valid value"
    testContract.valueB = 123
    testContract.valueC = true
    testContract.valueD = {doesnt: "matter"}
    testContract.valueE = [1, 2, 3]
    testContract.valueF = "doesnt matter"
    expect(testContract.isValid()).toBe(false)
    expect(testContract.errors).toStrictEqual({
      valueF: {messages: ['"doesnt matter" is not a valid Invalid']},
    })
  })

  it('validates with invalid string value', () => {
    const testContract = new TestContract()
    testContract.valueA = 123
    testContract.valueB = "Some valid value"
    testContract.valueC = 321
    testContract.valueD = {doesnt: "matter"}
    testContract.valueE = 123
    testContract.valueF = "doesnt matter"
    expect(testContract.isValid()).toBe(false)
    expect(testContract.errors).toStrictEqual({
      valueA: {messages: ['"123" is not a valid String']},
      valueB: {messages: ['"Some valid value" is not a valid Number']},
      valueC: {messages: ['"321" is not a valid Boolean']},
      valueE: {messages: ['"123" is not a valid Array']},
      valueF: {messages: ['"doesnt matter" is not a valid Invalid']},
    })
  })
})