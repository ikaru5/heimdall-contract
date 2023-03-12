import {describe, expect, it} from '@jest/globals';
import ContractBase from "../index.js"

describe("handling of special and rare cases", () => {
  class TestContractA extends ContractBase {
    defineSchema() {
      return (
        {
          ...super.defineSchema(),
          ...{
            valueA: {dType: "String", min: 10},
          }
        }
      )
    }
  }

  it('outbreaks if false returned', () => {
    const testContract = new TestContractA()
    testContract.valueA = "invalid"
    expect(testContract._validateProperty("doesnt matter", {})).toBe(undefined)
    expect(testContract.errors).toStrictEqual({})
  })

  class TestContractB extends ContractBase {
    defineSchema() {
      return (
        {
          ...super.defineSchema(),
          ...{
            valueA: {
              dType: "Array",
              innerValidate: {min: 123},
              arrayOf: {valueB: {dType: "String"}}
            },
          }
        }
      )
    }
  }

  it('ignores everything except breakers for innerValidate on contract arrays', () => {
    const testContract = new TestContractB()
    testContract.valueA = [{valueB: "valid"}]
    expect(testContract.isValid()).toBe(true)
    expect(testContract.errors).toStrictEqual({})
    expect(testContract.toObject()).toStrictEqual({
      valueA: [{valueB: "valid"}]
    })
  })

  class TestContractC extends ContractBase {
    defineSchema() {
      return (
        {
          ...super.defineSchema(),
          ...{
            valueA: {dType: "String", someInvalidValidation: true},
          }
        }
      )
    }
  }

  it('ignores invalid validations', () => {
    const testContract = new TestContractC()
    testContract.valueA = "valid"
    expect(testContract.isValid()).toBe(true)
    expect(testContract.errors).toStrictEqual({})
    expect(testContract.toObject()).toStrictEqual({
      valueA: "valid"
    })
  })

  class TestContractD extends ContractBase {
    defineSchema() {
      return (
        {
          ...super.defineSchema(),
          ...{
            valueA: {dType: "Some Invalid"},
          }
        }
      )
    }
  }

  it('handles unknown dType as Generic', () => {
    const testContract = new TestContractD()
    expect(testContract.isValid()).toBe(false)
    expect(testContract.errors).toStrictEqual({valueA: {messages: ['"null" is not a valid Some Invalid']}})
    expect(testContract.toObject()).toStrictEqual({
      valueA: null
    })
  })

  it('handles empty assignment', () => {
    const testContract = new TestContractD()
    expect(testContract.isAssignedEmpty).toBe(false)

    testContract.assign()
    expect(testContract.isAssignedEmpty).toBe(true)

    testContract.assign("")
    expect(testContract.isAssignedEmpty).toBe(true)
  })

  class TestContractE extends ContractBase {
    defineSchema() {
      return (
        {
          ...super.defineSchema(),
          ...{
            valueA: {dType: "Array"},
          }
        }
      )
    }
  }

  it('handles unknown arrayOf', () => {
    const testContract = new TestContractE()
    testContract.assign({valueA: [1, 2, 3]})
    expect(testContract.valueA).toStrictEqual([1, 2, 3])
    expect(testContract.toObject()).toStrictEqual({
      valueA: [1, 2, 3]
    })
  })

  it('ignores undefined value', () => {
    const testContract = new TestContractE()
    testContract.valueA = undefined
    expect(testContract.toObject()).toStrictEqual({
      valueA: undefined
    })
  })

})