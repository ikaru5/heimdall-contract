import {describe, expect, it} from '@jest/globals';
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
      valueA: {messages: ["must have less than 5 characters"]},
      valueB: {messages: ["must be lower or equal than 3"]},
      valueC: {messages: ["must have less than 3 elements"]},
    })
  })
})