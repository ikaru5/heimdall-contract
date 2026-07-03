import {describe, expect, it, jest} from '@jest/globals';
import ContractBase from "../../index.js"

describe("min validation", () => {
  class TestContract extends ContractBase {
    defineSchema() {
      return (
        {
          ...super.defineSchema(),
          ...{
            valueA: {dType: "String", min: 5},
            valueB: {dType: "Number", min: () => 3},
            valueC: {dType: "Array", arrayOf: "Generic", min: 2},
            valueD: {dType: "Generic", min: 2},
          }
        }
      )
    }
  }

  it('validates with valid values', () => {
    const testContract = new TestContract()
    testContract.valueA = "some valid value"
    testContract.valueB = 3
    testContract.valueC = [1, 2]
    testContract.valueD = {doesnt: "matter"}
    expect(testContract.isValid()).toBe(true)
    expect(testContract.errors).toStrictEqual({})
  })

  it('ignores wrong dType', () => {
    const testContract = new TestContract()
    testContract.valueA = 123
    testContract.valueB = "3"
    testContract.valueC = 321
    testContract.valueD = {doesnt: "matter"}
    expect(testContract.isValid()).toBe(false)
    expect(testContract.errors).toStrictEqual({
      fields: {
        valueA: {issues: [{validation: "dType", message: "\"123\" is not a valid String"}]},
        valueB: {issues: [{validation: "dType", message: "\"3\" is not a valid Number"}]},
        valueC: {issues: [{validation: "dType", message: "\"321\" is not a valid Array"}]}
      }
    })

    testContract.valueA = undefined
    testContract.valueB = null
    testContract.valueC = undefined
    testContract.valueD = undefined
    expect(testContract.isValid()).toBe(false)
    expect(testContract.errors).toStrictEqual({
      fields: {
        valueA: {issues: [{validation: "dType", message: "\"undefined\" is not a valid String"}]},
        valueB: {issues: [{validation: "dType", message: "\"null\" is not a valid Number"}]},
        valueC: {issues: [{validation: "dType", message: "\"undefined\" is not a valid Array"}]}
      }
    })
  })

  it('validates with invalid values', () => {
    const testContract = new TestContract()
    testContract.valueA = "tim"
    testContract.valueB = 2
    testContract.valueC = [100]
    testContract.valueD = {doesnt: "matter"}
    expect(testContract.isValid()).toBe(false)
    expect(testContract.errors).toStrictEqual({
      fields: {
        valueA: {issues: [{validation: "min", message: "must have at least 5 characters"}]},
        valueB: {issues: [{validation: "min", message: "must be greater than or equal to 3"}]},
        valueC: {issues: [{validation: "min", message: "must have at least 2 elements"}]}
      }
    })
  })

  it('validates with customLocalization for Array and Number dTypes', () => {
    class CustomLocalizationContract extends ContractBase {
      defineSchema() {
        return {
          ...super.defineSchema(),
          ...{
            arrayField: {dType: "Array", arrayOf: "Generic", min: 3},
            numberField: {dType: "Number", min: 10},
          }
        }
      }

      setConfig() {
        this.contractConfig.customLocalization = ({translationKey, fallbackValue, context}) => {
          // This will trigger the uncovered lines in validations.js for Array and Number dTypes
          return `Custom: ${fallbackValue}`
        }
      }
    }

    const testContract = new CustomLocalizationContract()

    testContract.arrayField = [1]  // Too few elements
    testContract.numberField = 5   // Too small number

    expect(testContract.isValid()).toBe(false)
    expect(testContract.errors).toStrictEqual({
      fields: {
        arrayField: {issues: [{validation: "min", message: "Custom: must have at least 3 elements"}]},
        numberField: {issues: [{validation: "min", message: "Custom: must be greater than or equal to 10"}]}
      }
    })
  })

  it('treats empty (null/undefined) values as valid and logs nothing', () => {
    class EmptyContract extends ContractBase {
      defineSchema() {
        return (
          {
            ...super.defineSchema(),
            ...{
              // Generic lets null pass the dType check, so min is the only possible complainer
              optional: {dType: "Generic", min: 5},
              required: {dType: "Generic", min: 5, presence: true},
            }
          }
        )
      }
    }

    const spy = jest.spyOn(console, "error").mockImplementation(() => {})

    const testContract = new EmptyContract()
    spy.mockClear() // scope the assertion to this validation only (ignore output of earlier tests)
    // both fields are empty (null) by default - min must not complain about them
    expect(testContract.isValid()).toBe(false) // invalid only because "required" has presence
    expect(testContract.errors).toStrictEqual({fields: {required: {issues: [{validation: "presence", message: "not present"}]}}})
    // empty values no longer trigger the "Invalid dType ... for minimum validation" console error
    expect(spy).not.toHaveBeenCalled()

    spy.mockRestore()
  })
})