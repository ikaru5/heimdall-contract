import {describe, expect, it} from '@jest/globals';
import ContractBase from "../../index.js"

describe("dType validation", () => {
  class TestContract extends ContractBase {
    // the schema contains an invalid dType on purpose, so strict schema linting must be off
    setConfig() {
      this.contractConfig.strictSchema = false
    }

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
      fields: {valueF: {issues: [{validation: "dType", message: "\"doesnt matter\" is not a valid Invalid"}]}}
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
      fields: {
        valueA: {issues: [{validation: "dType", message: "\"123\" is not a valid String"}]},
        valueB: {issues: [{validation: "dType", message: "\"Some valid value\" is not a valid Number"}]},
        valueC: {issues: [{validation: "dType", message: "\"321\" is not a valid Boolean"}]},
        valueE: {issues: [{validation: "dType", message: "\"123\" is not a valid Array"}]},
        valueF: {issues: [{validation: "dType", message: "\"doesnt matter\" is not a valid Invalid"}]}
      }
    })
  })
})