import {describe, expect, it} from '@jest/globals';
import ContractBase from "../../index.js"
import { validationDefinitions } from "../../validations.js"

describe("presence validation", () => {
  class TestContract extends ContractBase {
    defineSchema() {
      return (
        {
          ...super.defineSchema(),
          ...{
            valueA: {dType: "String", presence: true},
            valueB: {dType: "String", presence: false},
            valueC: {dType: "String", presence: () => true},

            valueD: {dType: "Number", presence: true},
            valueE: {dType: "Boolean", presence: true},
            valueF: {dType: "Generic", presence: true},
            valueG: {dType: "Generic", presence: true},
            valueH: {dType: "Array", presence: true},
            valueI: {dType: "Array", presence: true}
          }
        }
      )
    }
  }

  it('validates with valid values', () => {
    const testContract = new TestContract()
    testContract.valueA = "Some valid value"
    testContract.valueB = "Some valid value"
    testContract.valueC = "Some valid value"
    testContract.valueD = 123
    testContract.valueE = true
    testContract.valueF = {doesnt: "matter"}
    testContract.valueG = {doesnt: "matter"}
    testContract.valueH = [1, 2, 3]
    testContract.valueI = [1, 2, 3]
    expect(testContract.isValid()).toBe(true)
    expect(testContract.errors).toStrictEqual({})
  })

  it('validates with invalid values', () => {
    const testContract = new TestContract()
    testContract.valueA = ""
    testContract.valueB = undefined
    testContract.valueC = null
    testContract.valueD = undefined
    testContract.valueE = undefined
    testContract.valueF = undefined
    testContract.valueG = null
    testContract.valueH = []
    testContract.valueI = undefined
    expect(testContract.isValid()).toBe(false)
    expect(testContract.errors).toStrictEqual({
      valueA: {messages: ["not present"]},
      valueB: {messages: ['"undefined" is not a valid String']},
      valueC: {messages: ['"null" is not a valid String', "not present"]},
      valueD: {messages: ['"undefined" is not a valid Number', "not present"]},
      valueE: {messages: ['"undefined" is not a valid Boolean', "not present"]},
      valueF: {messages: ["not present"]},
      valueG: {messages: ["not present"]},
      valueH: {messages: ["not present"]},
      valueI: {messages: ['"undefined" is not a valid Array', "not present"]},
    })
  })

  it('validates directly with check method', () => {
    const checkMethod = validationDefinitions.normal.presence.check

    // this is easier to test directly
    expect(
      checkMethod({value: "doesnt matter", config: true, dType: "Invalid"})
    ).toBe(false)
  })
})