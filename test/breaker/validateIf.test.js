import {describe, expect, it} from '@jest/globals';
import ContractBase from "../../index.js"

class ReturnStub {
  static returnValue = true
}

describe("validateIf breaker", () => {
  class TestContract extends ContractBase {
    defineSchema() {
      return (
        {
          ...super.defineSchema(),
          ...{
            valueA: {dType: "String", validateIf: () => ReturnStub.returnValue, min: 10},
          }
        }
      )
    }
  }

  it('outbreaks if false returned', () => {
    const testContract = new TestContract()
    ReturnStub.returnValue = false
    testContract.valueA = "invalid"
    expect(testContract.isValid()).toBe(true)
    expect(testContract.errors).toStrictEqual({})
  })

  it('doesnt outbreaks if true returned', () => {
    const testContract = new TestContract()
    ReturnStub.returnValue = true
    testContract.valueA = "invalid"
    expect(testContract.isValid()).toBe(false)
    expect(testContract.errors).toStrictEqual({
      valueA: {messages: ["must have at least 10 characters"]},
    })
  })
})