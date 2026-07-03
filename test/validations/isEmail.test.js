import {describe, expect, it} from '@jest/globals';
import ContractBase from "../../index.js"

describe("isEmail validation", () => {
  class TestContract extends ContractBase {
    defineSchema() {
      return (
        {
          ...super.defineSchema(),
          ...{
            valueA: {dType: "String", isEmail: true},
            valueB: {dType: "String", isEmail: () => true},
            valueC: {dType: "String", isEmail: false},
          }
        }
      )
    }
  }

  it('validates with valid values', () => {
    const testContract = new TestContract()
    testContract.valueA = "some@valid.com"
    testContract.valueB = "some@valid.com"
    testContract.valueC = "Some valid value"
    expect(testContract.isValid()).toBe(true)
    expect(testContract.errors).toStrictEqual({})
  })

  it('validates with invalid values', () => {
    const testContract = new TestContract()
    testContract.valueA = "some not valid com"
    testContract.valueB = "some not valid com"
    testContract.valueC = "some@valid.com"
    expect(testContract.isValid()).toBe(false)
    expect(testContract.errors).toStrictEqual({
      fields: {
        valueA: {issues: [{validation: "isEmail", message: "must be a valid E-Mail"}]},
        valueB: {issues: [{validation: "isEmail", message: "must be a valid E-Mail"}]},
        valueC: {issues: [{validation: "isEmail", message: "must not be an E-Mail"}]}
      }
    })
  })
})

describe("isEmail regex behavior (WHATWG definition)", () => {
  class EmailContract extends ContractBase {
    defineSchema() {
      return (
        {
          ...super.defineSchema(),
          ...{
            email: {dType: "String", isEmail: true}
          }
        }
      )
    }
  }

  const expectEmail = (value, valid) => {
    const contract = new EmailContract()
    contract.email = value
    expect(contract.isValid()).toBe(valid)
  }

  it('accepts common valid addresses', () => {
    expectEmail("some@valid.com", true)
    expectEmail("user+tag@gmail.com", true)      // plus addressing
    expectEmail("first.last@example.com", true)  // dots in local part
    expectEmail("kirill@company.systems", true)  // TLD longer than 3 characters
    expectEmail("user@mail.example.co.uk", true) // subdomains
    expectEmail("o'brien@example.ie", true)      // apostrophe is allowed by the WHATWG definition
  })

  it('accepts dotless domains like browser email inputs do', () => {
    expectEmail("user@localhost", true)
  })

  it('rejects invalid addresses', () => {
    expectEmail("some not valid com", false)
    expectEmail("user@", false)
    expectEmail("@example.com", false)
    expectEmail("user@@example.com", false)
    expectEmail("user@example..com", false)
    expectEmail("user@-example-.com", false) // domain labels must not start or end with a hyphen
    expectEmail("user@example.com.", false)  // trailing dot
    expectEmail("us er@example.com", false)
  })

  it('handles pathological input without catastrophic backtracking (ReDoS regression)', () => {
    // the regex used before v0.7.1 needed over 30 seconds for a 37-character input of this shape
    const pathologicalInput = "a".repeat(64) + "@" + "a".repeat(64) + "!"
    const start = Date.now()
    expectEmail(pathologicalInput, false)
    expect(Date.now() - start).toBeLessThan(1000)
  })
})