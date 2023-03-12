import {describe, expect, it} from '@jest/globals';
import ContractBase from "../../index.js"

class ReturnStub {
  static returnValue = true
}

describe("custom validate", () => {
  class TestContract extends ContractBase {
    defineSchema() {
      return (
        {
          ...super.defineSchema(),
          ...{
            valueA: {dType: "String", validate: () => ReturnStub.returnValue},
          }
        }
      )
    }
  }

  it('passes if true returned', () => {
    const testContract = new TestContract()
    testContract.valueA = "abc"
    ReturnStub.returnValue = true
    expect(testContract.isValid()).toBe(true)
    expect(testContract.errors).toStrictEqual({})
  })

  it('fails if false returned and returns generic error', () => {
    const testContract = new TestContract()
    testContract.valueA = "abc"
    ReturnStub.returnValue = false
    expect(testContract.isValid()).toBe(false)
    expect(testContract.errors).toStrictEqual({
      valueA: {messages: ["Field invalid!"]},
    })
  })

  it('fails and returns custom error message', () => {
    const testContract = new TestContract()
    testContract.valueA = "abc"
    ReturnStub.returnValue = "some error message"
    expect(testContract.isValid()).toBe(false)
    expect(testContract.errors).toStrictEqual({
      valueA: {messages: ["some error message"]},
    })
  })
})