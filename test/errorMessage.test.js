import {describe, expect, it} from '@jest/globals';
import ContractBase from "../index.js"

describe("errorMessage property", () => {
  class TestContract extends ContractBase {
    defineSchema() {
      return (
        {
          ...super.defineSchema(),
          ...{
            valueA: {dType: "Number", min: 5, errorMessage: "test error message 1"},
            valueB: {dType: "Number", min: 5, errorMessage: () => "test error message 2"},

            valueC: {dType: "Number", min: 5, max: 3, errorMessage: {min: "test error message min", max: "test error message max"}},
            valueD: {dType: "Number", min: 5, max: 3, errorMessage: {min: () => "test error message min", max: () => "test error message max"}},

            valueE: {dType: "Number", min: 5, max: 3, errorMessage: {min: "test error message min", default: "test error message default"}},
            valueF: {dType: "Number", min: 5, max: 3, errorMessage: {min: "test error message min", default: () => "test error message default"}},
          }
        }
      )
    }
  }

  it('validates with invalid values', () => {
    const testContract = new TestContract()
    testContract.valueA = 4
    testContract.valueB = 4
    testContract.valueC = 4
    testContract.valueD = 4
    testContract.valueE = 4
    testContract.valueF = 4

    expect(testContract.isValid()).toBe(false)
    expect(testContract.errors).toStrictEqual({
      valueA: {messages: ["test error message 1"]},
      valueB: {messages: ["test error message 2"]},
      valueC: {messages: ["test error message min", "test error message max"]},
      valueD: {messages: ["test error message min", "test error message max"]},
      valueE: {messages: ["test error message min", "test error message default"]},
      valueF: {messages: ["test error message min", "test error message default"]},
    })
  })
})