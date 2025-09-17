import {describe, expect, it} from '@jest/globals';
import {ContractBase} from "../index.js"

describe("constructor options handling", () => {

  class MinimalTestContract extends ContractBase {
    defineSchema() {
      return {
        name: {dType: "String"}
      }
    }
  }

  it('should handle initNested function in constructor options', () => {
    let initNestedExecuted = false
    
    const contract = new MinimalTestContract({
      initNested: function() {
        this.testProperty = "set by initNested"
        initNestedExecuted = true
      }
    })
    
    expect(initNestedExecuted).toBe(true)
    expect(contract.testProperty).toBe("set by initNested")
    expect(typeof contract.initNested).toBe("function")
  })

  it('should handle initAll function in constructor options', () => {
    let initAllExecuted = false
    
    const contract = new MinimalTestContract({
      initAll: function() {
        this.testProperty = "set by initAll"
        initAllExecuted = true
      }
    })
    
    expect(initAllExecuted).toBe(true)
    expect(contract.testProperty).toBe("set by initAll")
    expect(typeof contract.initAll).toBe("function")
  })

  it('should handle _getNameOfClass with non-function parameter', () => {
    const contract = new MinimalTestContract()
    
    // Test _getNameOfClass with string parameter (non-function)
    const result = contract._getNameOfClass("StringClassName")
    expect(result).toBe("StringClassName")
    
    // Test _getNameOfClass with function parameter
    const funcResult = contract._getNameOfClass(MinimalTestContract)
    expect(funcResult).toBe("MinimalTestContract")
  })

})