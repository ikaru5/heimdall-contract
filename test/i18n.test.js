import {describe, expect, it} from '@jest/globals';
import { ContractBase } from "../index.js"

class I18n {
  static lastKey = undefined

  constructor() {
    this.t = (key) => I18n.lastKey = key
  }
}

describe("allowBlank breaker", () => {
  class TestContract extends ContractBase {
    defineSchema() {
      return (
        {
          ...super.defineSchema(),
          ...{
            valueA: {dType: "String", on: "dType"},
            valueB: {dType: "String", presence: true, on: "presence"},
            valueC: {dType: "String", absence: true, on: "absence"},
            valueD: {dType: "String", isEmail: true, on: "isEmailA"},
            valueE: {dType: "String", isEmail: () => false, on: "isEmailB"},
            valueF: {dType: "String", match: () => /^[a-zA-Z0-9\s]*$/, on: "match"},
            valueG: {dType: "String", only: () => ["Tim"], on: "onlyA"},
            valueH: {dType: "String", only: ["Tim", "Tom"], on: "onlyB"},
            valueI: {dType: "String", strictOnly: () => ["Tim"], on: "strictOnlyA"},
            valueJ: {dType: "String", strictOnly: ["Tim", "Tom"], on: "strictOnlyB"},
            valueK: {dType: "String", min: () => 5, on: "min"},
            valueL: {dType: "String", max: () => 5, on: "max"},
            valueM: {dType: "String", validate: () => false, on: "validate"},
          }
        }
      )
    }

    setConfig() {
      const i18n = new I18n()
      this.contractConfig.customLocalization = ({translationKey, translationKeys, fallbackValue}) => {
        // For single keys, pass the translationKey; for multiple keys, pass the array
        const key = (translationKeys && translationKeys.length > 1) ? translationKeys : translationKey
        return i18n.t(key)
      }
    }
  }

  it('calls for dType', () => {
    const testContract = new TestContract()
    testContract.valueA = 123
    expect(testContract.isValid("dType")).toBe(false)
    expect(I18n.lastKey).toStrictEqual(["errors:dType.String", "errors:dType.default"])
  })

  it('calls for presence', () => {
    const testContract = new TestContract()
    testContract.valueB = undefined
    expect(testContract.isValid("presence")).toBe(false)
    expect(I18n.lastKey).toStrictEqual(["errors:presence.true", "errors:presence"])
  })

  it('calls for absence', () => {
    const testContract = new TestContract()
    testContract.valueC = "some value"
    expect(testContract.isValid("absence")).toBe(false)
    expect(I18n.lastKey).toStrictEqual(["errors:presence.false", "errors:absence.true", "errors:absence"])
  })

  it('calls for isEmail', () => {
    const testContract = new TestContract()
    testContract.valueD = "some invalid value"
    expect(testContract.isValid("isEmailA")).toBe(false)
    expect(I18n.lastKey).toStrictEqual("errors:isEmail.true")

    testContract.valueE = "some@email.com"
    expect(testContract.isValid("isEmailB")).toBe(false)
    expect(I18n.lastKey).toStrictEqual("errors:isEmail.false")
  })

  it('calls for regex', () => {
    const testContract = new TestContract()
    testContract.valueF = "Test- fswe 325"
    expect(testContract.isValid("match")).toBe(false)
    expect(I18n.lastKey).toStrictEqual("errors:generic")
  })

  it('calls for only', () => {
    const testContract = new TestContract()
    testContract.valueG = "some invalid value"
    expect(testContract.isValid("onlyA")).toBe(false)
    expect(I18n.lastKey).toStrictEqual("errors:only.singular")

    testContract.valueH = "some invalid value"
    expect(testContract.isValid("onlyB")).toBe(false)
    expect(I18n.lastKey).toStrictEqual("errors:only.plural")
  })

  it('calls for strictOnly', () => {
    const testContract = new TestContract()
    testContract.valueI = "some invalid value"
    expect(testContract.isValid("strictOnlyA")).toBe(false)
    expect(I18n.lastKey).toStrictEqual("errors:strictOnly.singular")

    testContract.valueJ = "some invalid value"
    expect(testContract.isValid("strictOnlyB")).toBe(false)
    expect(I18n.lastKey).toStrictEqual("errors:strictOnly.plural")
  })

  it('calls for min', () => {
    const testContract = new TestContract()
    testContract.valueK = "abc"
    expect(testContract.isValid("min")).toBe(false)
    expect(I18n.lastKey).toStrictEqual("errors:min.String")
  })

  it('calls for max', () => {
    const testContract = new TestContract()
    testContract.valueL = "abcdef"
    expect(testContract.isValid("max")).toBe(false)
    expect(I18n.lastKey).toStrictEqual("errors:max.String")
  })

  it('calls generic for validate', () => {
    const testContract = new TestContract()
    testContract.valueM = "abcdef"
    expect(testContract.isValid("validate")).toBe(false)
    expect(I18n.lastKey).toStrictEqual("errors:generic")
  })
})