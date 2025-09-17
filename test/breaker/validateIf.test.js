import {describe, expect, it} from '@jest/globals';
import ContractBase from "../../index.js"

class ReturnStub {
  static returnValue = true
}

describe("validateIf breaker", () => {
  class TestContract extends ContractBase {
    defineSchema() {
      return (
        {
          ...super.defineSchema(),
          ...{
            valueA: {dType: "String", validateIf: () => ReturnStub.returnValue, min: 10},
          }
        }
      )
    }
  }

  it('outbreaks if false returned', () => {
    const testContract = new TestContract()
    ReturnStub.returnValue = false
    testContract.valueA = "invalid"
    expect(testContract.isValid()).toBe(true)
    expect(testContract.errors).toStrictEqual({})
  })

  it('doesnt outbreaks if true returned', () => {
    const testContract = new TestContract()
    ReturnStub.returnValue = true
    testContract.valueA = "invalid"
    expect(testContract.isValid()).toBe(false)
    expect(testContract.errors).toStrictEqual({
      valueA: {messages: ["must have at least 10 characters"]},
    })
  })

  it('handles custom validateIf function that returns false and outbreaks validation', () => {
    class TestContractCustomValidateIf extends ContractBase {
      defineSchema() {
        return {
          ...super.defineSchema(),
          ...{
            valueB: {
              dType: "String", 
              validateIf: function(propValue, instance, dType, depth) { 
                return propValue !== "skip"; // returns false when value is "skip"
              },
              presence: true
            },
          }
        }
      }
    }

    const testContract = new TestContractCustomValidateIf()
    testContract.valueB = "skip" // This should trigger the false return and outbreak
    expect(testContract.isValid()).toBe(true)
    expect(testContract.errors).toStrictEqual({})
    
    // Also test the true case
    testContract.valueB = "valid"
    expect(testContract.isValid()).toBe(true)
    
    // Test when validateIf returns true but validation fails
    testContract.valueB = ""
    expect(testContract.isValid()).toBe(false)
    expect(testContract.errors.valueB.messages).toContain("not present")
  })
})