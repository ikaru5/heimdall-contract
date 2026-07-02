import {describe, expect, it, jest} from '@jest/globals';
import ContractBase from "../../index.js"

describe("max validation", () => {
  class TestContract extends ContractBase {
    defineSchema() {
      return (
        {
          ...super.defineSchema(),
          ...{
            valueA: {dType: "String", max: 5},
            valueB: {dType: "Number", max: () => 3},
            valueC: {dType: "Array", max: 3},
            valueD: {dType: "Generic", max: 2},
          }
        }
      )
    }
  }

  it('validates with valid values', () => {
    const testContract = new TestContract()
    testContract.valueA = "times"
    testContract.valueB = 3
    testContract.valueC = [1, 2, 3]
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
      valueA: {messages: ['"123" is not a valid String']},
      valueB: {messages: ['"3" is not a valid Number']},
      valueC: {messages: ['"321" is not a valid Array']},
    })

    testContract.valueA = undefined
    testContract.valueB = null
    testContract.valueC = undefined
    testContract.valueD = undefined
    expect(testContract.isValid()).toBe(false)
    expect(testContract.errors).toStrictEqual({
      valueA: {messages: ['"undefined" is not a valid String']},
      valueB: {messages: ['"null" is not a valid Number']},
      valueC: {messages: ['"undefined" is not a valid Array']},
    })
  })

  it('validates with invalid values', () => {
    const testContract = new TestContract()
    testContract.valueA = "Thomas"
    testContract.valueB = 4
    testContract.valueC = [100, 0, 2, 1]
    testContract.valueD = {doesnt: "matter"}
    expect(testContract.isValid()).toBe(false)
    expect(testContract.errors).toStrictEqual({
      valueA: {messages: ["must have at most 5 characters"]},
      valueB: {messages: ["must be less than or equal to 3"]},
      valueC: {messages: ["must have at most 3 elements"]},
    })
  })

  it('validates with customLocalization for Array and Number dTypes', () => {
    class CustomLocalizationContract extends ContractBase {
      defineSchema() {
        return {
          ...super.defineSchema(),
          ...{
            arrayField: {dType: "Array", max: 2},
            numberField: {dType: "Number", max: 5},
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

    testContract.arrayField = [1, 2, 3, 4]  // Too many elements
    testContract.numberField = 10           // Too large number

    expect(testContract.isValid()).toBe(false)
    expect(testContract.errors).toStrictEqual({
      arrayField: {messages: ["Custom: must have at most 2 elements"]},
      numberField: {messages: ["Custom: must be less than or equal to 5"]},
    })
  })

  it('treats empty (null/undefined) values as valid and logs nothing', () => {
    class EmptyContract extends ContractBase {
      defineSchema() {
        return (
          {
            ...super.defineSchema(),
            ...{
              // Generic lets null pass the dType check, so max is the only possible complainer
              optional: {dType: "Generic", max: 5},
              required: {dType: "Generic", max: 5, presence: true},
            }
          }
        )
      }
    }

    const spy = jest.spyOn(console, "error").mockImplementation(() => {})

    const testContract = new EmptyContract()
    spy.mockClear() // scope the assertion to this validation only (ignore output of earlier tests)
    // both fields are empty (null) by default - max must not complain about them
    expect(testContract.isValid()).toBe(false) // invalid only because "required" has presence
    expect(testContract.errors).toStrictEqual({
      required: {messages: ["not present"]}
    })
    // empty values no longer trigger the "Invalid dType ... for maximum validation" console error
    expect(spy).not.toHaveBeenCalled()

    spy.mockRestore()
  })
})