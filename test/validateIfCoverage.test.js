import {describe, expect, it} from '@jest/globals';
import {ContractBase} from "../index.js"

describe("validateIf coverage test", () => {
  
  it('should cover line 183 in validation-base.js when validateIf returns false', () => {
    class TestContract extends ContractBase {
      defineSchema() {
        return {
          ...super.defineSchema(),
          ...{
            testField: {
              dType: "String",
              validateIf: () => false, // This should trigger line 183
              presence: true
            }
          }
        }
      }
    }

    const contract = new TestContract()
    contract.testField = "any value"
    
    // Since validateIf returns false, validation should be skipped (outbreak)
    expect(contract.isValid()).toBe(true)
    expect(contract.errors).toStrictEqual({})
  })
  
})