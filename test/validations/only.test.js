import {describe, expect, it} from '@jest/globals';
import ContractBase from "../../index.js"

describe("only validation", () => {
  class TestContract extends ContractBase {
    defineSchema() {
      return (
        {
          ...super.defineSchema(),
          ...{
            valueA: {dType: "String", only: "only valid value"},
            valueB: {dType: "String", only: ["Tim", "Tom"]},
            valueC: {dType: "Array", arrayOf: "Generic", only: ["Tim", "Tom"]},
            valueD: {dType: "Array", arrayOf: "Generic", only: () => ["Tim", "Tom"]},
            valueE: {dType: "String", only: ["Tim"]},
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
    testContract.valueD = ["Tom"]
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
      fields: {valueB: {issues: [{validation: "dType", message: "\"undefined\" is not a valid String"}]}}
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
      fields: {
        valueA: {issues: [{validation: "only", message: "must be \"only valid value\""}]},
        valueB: {issues: [{validation: "only", message: "must be \"Tim\" or \"Tom\""}]},
        valueC: {issues: [{validation: "only", message: "must be \"Tim\" or \"Tom\""}]},
        valueD: {issues: [{validation: "only", message: "must be \"Tim\" or \"Tom\""}]},
        valueE: {issues: [{validation: "only", message: "must be \"Tim\""}]}
      }
    })
  })
})