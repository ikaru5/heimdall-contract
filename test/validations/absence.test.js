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
            valueG: {dType: "Array", arrayOf: "Generic", absence: true},
            valueH: {dType: "Array", arrayOf: "Generic", absence: true}
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
      fields: {
        valueA: {issues: [{validation: "dType", message: "\"undefined\" is not a valid String"}]},
        valueD: {issues: [{validation: "dType", message: "\"undefined\" is not a valid Number"}]},
        valueE: {issues: [{validation: "dType", message: "\"undefined\" is not a valid Boolean"}]},
        valueG: {issues: [{validation: "dType", message: "\"undefined\" is not a valid Array"}]}
      }
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
      fields: {
        valueA: {issues: [{validation: "absence", message: "must be absent"}]},
        valueB: {issues: [{validation: "dType", message: "\"null\" is not a valid String"}]},
        valueC: {issues: [{validation: "absence", message: "must be absent"}]},
        valueD: {issues: [{validation: "absence", message: "must be absent"}]},
        valueE: {issues: [{validation: "absence", message: "must be absent"}]},
        valueF: {issues: [{validation: "absence", message: "must be absent"}]},
        valueG: {issues: [{validation: "absence", message: "must be absent"}]},
        valueH: {issues: [{validation: "absence", message: "must be absent"}]}
      }
    })
  })
})