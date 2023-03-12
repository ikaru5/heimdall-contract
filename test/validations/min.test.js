import {describe, expect, it} from '@jest/globals';
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
            valueC: {dType: "Array", min: 2},
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
    testContract.valueA = "tim"
    testContract.valueB = 2
    testContract.valueC = [100]
    testContract.valueD = {doesnt: "matter"}
    expect(testContract.isValid()).toBe(false)
    expect(testContract.errors).toStrictEqual({
      valueA: {messages: ["must have at least 5 characters"]},
      valueB: {messages: ["must be greater than or equal to 3"]},
      valueC: {messages: ["must have at least 2 elements"]},
    })
  })
})