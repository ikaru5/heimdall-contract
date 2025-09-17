import {describe, expect, it} from '@jest/globals';
import {ContractBase} from "../index.js"

describe("hooks handling", () => {

  class TestContractNested extends ContractBase {
    init() {
      this.initedByHook = "nested"
    }

    // should not be called and will be overwritten by base
    initNested() {
      this.nestedInitedByHook = "nested"
    }

    // should not be called and will be overwritten by base
    initAll() {
      this.allInitedByHook = "nested"
    }

    defineSchema() {
      return (
        {
          ...super.defineSchema(),
          ...{
            valueA: {dType: "String"},
          }
        }
      )
    }
  }

  class TestContract extends ContractBase {
    init() {
      this.initedByHook = "base"
    }

    initNested() {
      this.nestedInitedByHook = "base"
    }

    initAll() {
      this.allInitedByHook = "base"
    }

    defineSchema() {
      return (
        {
          ...super.defineSchema(),
          ...{
            valueA: {dType: "Contract", contract: TestContractNested},
          }
        }
      )
    }
  }

  it('validates with valid values', () => {
    const testContract = new TestContract()
    testContract.assign(
      {
        valueA: {
          valueA: "some valid value",
        }
      }
    )
    expect(testContract.isValid()).toBe(true)
    expect(testContract.errors).toStrictEqual({})

    expect(testContract.valueA.initedByHook).toBe("nested")
    expect(testContract.valueA.nestedInitedByHook).toBe("base")
    expect(testContract.valueA.allInitedByHook).toBe("base")

    expect(testContract.initedByHook).toBe("base")
    expect(testContract.nestedInitedByHook).toBe(undefined)
    expect(testContract.allInitedByHook).toBe("base")
  })

  it('should execute initNested function when passed in constructor options', () => {
    let initNestedCalled = false
    const initNestedFunction = function() {
      this.customInitNestedValue = "executed"
      initNestedCalled = true
    }
    
    class SimpleTestContract extends ContractBase {
      defineSchema() {
        return {
          ...super.defineSchema(),
          ...{
            name: {dType: "String"}
          }
        }
      }
    }
    
    const testContract = new SimpleTestContract({
      initNested: initNestedFunction
    })
    
    expect(initNestedCalled).toBe(true)
    expect(testContract.customInitNestedValue).toBe("executed")
    expect(typeof testContract.initNested).toBe("function")
  })

})