import {describe, expect, it} from '@jest/globals';
import ContractBase from "../../index.js"

describe("match validation", () => {
  class RegexContract extends ContractBase {
    defineSchema() {
      return (
        {
          ...super.defineSchema(),
          ...{
            value: {dType: "String", match: /^[a-zA-Z0-9\s]*$/},
          }
        }
      )
    }
  }

  it('validates with regex', () => {
    const regexContract = new RegexContract()
    regexContract.value = "Test123 4325 dfsfg 423njki423"
    expect(regexContract.isValid()).toBe(true)
    expect(regexContract.errors).toStrictEqual({})

    regexContract.value = "Test- fswe 325"
    expect(regexContract.isValid()).toBe(false)
    expect(regexContract.errors).toStrictEqual({value: {messages: ["invalid"]}})
  })
})