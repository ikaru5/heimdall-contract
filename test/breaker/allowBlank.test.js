import {describe, expect, it} from '@jest/globals';
import ContractBase from "../../index.js"

describe("allowBlank breaker", () => {
  class TestContract extends ContractBase {
    defineSchema() {
      return (
        {
          ...super.defineSchema(),
          ...{
            valueA: {dType: "String", min: 10},
            valueB: {dType: "String", min: 10, allowBlank: false},
            valueC: {dType: "String", min: 10, allowBlank: true},
            valueD: {dType: "String", min: 10, allowBlank: () => true},
            valueE: {dType: "String", min: 10, allowBlank: undefined},
          }
        }
      )
    }
  }

  it('validates with valid value', () => {
    const testContract = new TestContract()
    testContract.valueA = "Some valid value"
    testContract.valueB = "Some valid value"
    testContract.valueC = "Some valid value"
    testContract.valueD = "Some valid value"
    testContract.valueE = "Some valid value"
    expect(testContract.isValid()).toBe(true)
    expect(testContract.errors).toStrictEqual({})
  })

  it('validates with blank string value', () => {
    const testContract = new TestContract()
    testContract.valueA = ""
    testContract.valueB = ""
    testContract.valueC = ""
    testContract.valueD = ""
    testContract.valueE = ""
    expect(testContract.isValid()).toBe(false)
    expect(testContract.errors).toStrictEqual({
      valueA: {messages: ["must have at least 10 characters"]},
      valueB: {messages: ["must have at least 10 characters"]},
      valueE: {messages: ["must have at least 10 characters"]},
    })
  })
})