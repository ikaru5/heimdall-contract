import {describe, expect, it} from '@jest/globals';
import ContractBase from "../../index.js"

describe("isEmail validation", () => {
  class TestContract extends ContractBase {
    defineSchema() {
      return (
        {
          ...super.defineSchema(),
          ...{
            valueA: {dType: "String", isEmail: true},
            valueB: {dType: "String", isEmail: () => true},
            valueC: {dType: "String", isEmail: false},
          }
        }
      )
    }
  }

  it('validates with valid values', () => {
    const testContract = new TestContract()
    testContract.valueA = "some@valid.com"
    testContract.valueB = "some@valid.com"
    testContract.valueC = "Some valid value"
    expect(testContract.isValid()).toBe(true)
    expect(testContract.errors).toStrictEqual({})
  })

  it('validates with invalid values', () => {
    const testContract = new TestContract()
    testContract.valueA = "some not valid com"
    testContract.valueB = "some not valid com"
    testContract.valueC = "some@valid.com"
    expect(testContract.isValid()).toBe(false)
    expect(testContract.errors).toStrictEqual({
      valueA: {messages: ["must be a valid E-Mail"]},
      valueB: {messages: ["must be a valid E-Mail"]},
      valueC: {messages: ["must not be an E-Mail"]},
    })
  })
})