import {describe, expect, it} from '@jest/globals';
import { ContractBase } from "../index.js"

class MockI18n {
  static lastKey = undefined

  constructor() {
    this.t = (key) => {
      MockI18n.lastKey = key
      return `translated: ${key}`
    }
  }
}

describe("tryTranslateMessages functionality", () => {
  class TestContract extends ContractBase {
    defineSchema() {
      return {
        ...super.defineSchema(),
        ...{
          // Test string errorMessage with only presence validation
          valueA: {dType: "String", presence: true, errorMessage: "custom.error.message"},
          
          // Test object errorMessage with default - use min validation to avoid dType issues
          valueB: {dType: "String", min: 5, errorMessage: {default: "custom.default.message"}},
          
          // Test object errorMessage with specific validation key
          valueC: {dType: "String", presence: true, errorMessage: {presence: "custom.presence.message"}},
          
          // Test function errorMessage (should not be translated)
          valueD: {dType: "String", presence: true, errorMessage: () => "function error message"},
        }
      }
    }

    setConfig() {
      const i18n = new MockI18n()
      this.contractConfig.customLocalization = ({translationKey, translationKeys, fallbackValue}) => {
        const key = translationKeys ? translationKeys.join(",") : translationKey
        return i18n.t(key)
      }
      this.contractConfig.tryTranslateMessages = true
    }
  }

  class TestContractWithoutTranslation extends ContractBase {
    defineSchema() {
      return {
        ...super.defineSchema(),
        ...{
          valueA: {dType: "String", presence: true, errorMessage: "custom.error.message"},
          valueB: {dType: "String", min: 5, errorMessage: {default: "custom.default.message"}},
          valueC: {dType: "String", presence: true, errorMessage: {presence: "custom.presence.message"}},
        }
      }
    }

    setConfig() {
      const i18n = new MockI18n()
      this.contractConfig.customLocalization = ({translationKey, translationKeys, fallbackValue}) => {
        const key = translationKeys ? translationKeys.join(",") : translationKey
        return i18n.t(key)
      }
      this.contractConfig.tryTranslateMessages = false
    }
  }

  class TestContractWithoutI18next extends ContractBase {
    defineSchema() {
      return {
        ...super.defineSchema(),
        ...{
          valueA: {dType: "String", presence: true, errorMessage: "custom.error.message"},
        }
      }
    }

    setConfig() {
      this.contractConfig.customLocalization = undefined
      this.contractConfig.tryTranslateMessages = true
    }
  }

  it('should translate string errorMessage when tryTranslateMessages is enabled', () => {
    const contract = new TestContract()
    contract.valueA = undefined
    
    expect(contract.isValid()).toBe(false)
    // undefined triggers both dType and presence validations, both use the same custom errorMessage
    expect(contract.errors.valueA.messages).toStrictEqual([
      "translated: custom.error.message",
      "translated: custom.error.message"
    ])
  })

  it('should translate errorMessage.default when tryTranslateMessages is enabled', () => {
    const contract = new TestContract()
    contract.valueB = "abc" // Too short for min: 5
    
    expect(contract.isValid()).toBe(false)
    expect(contract.errors.valueB.messages).toStrictEqual(["translated: custom.default.message"])
  })

  it('should translate errorMessage[validationName] when tryTranslateMessages is enabled', () => {
    const contract = new TestContract()
    contract.valueC = undefined
    
    expect(contract.isValid()).toBe(false)
    // undefined triggers dType validation (uses built-in i18next message) AND presence validation (uses custom message)
    expect(contract.errors.valueC.messages).toStrictEqual([
      "translated: errors:dType.String,errors:dType.default",
      "translated: custom.presence.message"
    ])
  })

  it('should not translate function errorMessage', () => {
    const contract = new TestContract()
    contract.valueD = undefined
    
    expect(contract.isValid()).toBe(false)
    // undefined triggers both dType and presence validations, both use the same function errorMessage
    expect(contract.errors.valueD.messages).toStrictEqual([
      "function error message",
      "function error message"
    ])
  })

  it('should not translate when tryTranslateMessages is disabled', () => {
    const contract = new TestContractWithoutTranslation()
    contract.valueA = undefined
    
    expect(contract.isValid()).toBe(false)
    // undefined triggers both dType and presence validations, both use the same custom errorMessage
    expect(contract.errors.valueA.messages).toStrictEqual([
      "custom.error.message",
      "custom.error.message"
    ])
  })

  it('should not translate when localizationMethod is not i18next', () => {
    const contract = new TestContractWithoutI18next()
    contract.valueA = undefined
    
    expect(contract.isValid()).toBe(false)
    // undefined triggers both dType and presence validations, both use the same custom errorMessage
    expect(contract.errors.valueA.messages).toStrictEqual([
      "custom.error.message",
      "custom.error.message"
    ])
  })

  it('should work with multiple validation failures and mixed errorMessage types', () => {
    const contract = new TestContract()
    contract.valueA = undefined
    contract.valueB = "abc" // Too short for min: 5
    contract.valueC = undefined
    contract.valueD = undefined
    
    expect(contract.isValid()).toBe(false)
    expect(contract.errors).toStrictEqual({
      valueA: {messages: [
        "translated: custom.error.message",
        "translated: custom.error.message"
      ]},
      valueB: {messages: ["translated: custom.default.message"]},
      valueC: {messages: [
        "translated: errors:dType.String,errors:dType.default",
        "translated: custom.presence.message"
      ]},
      valueD: {messages: [
        "function error message",
        "function error message"
      ]},
    })
  })
})