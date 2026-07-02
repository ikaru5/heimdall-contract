import {describe, expect, it} from '@jest/globals';
import ContractBase from "../index.js"

// Heimdall must never mutate the user provided schema. Since the modules run in strict mode,
// any write to a frozen object throws a TypeError - so validating against a deeply frozen
// schema proves that no code path mutates it.
describe("schema mutation safety", () => {
  const deepFreeze = (object) => {
    for (const value of Object.values(object)) {
      if (null !== value && "object" === typeof value) deepFreeze(value)
    }
    return Object.freeze(object)
  }

  it('never mutates the user provided schema', () => {
    const schema = deepFreeze({
      name: {dType: "String", presence: true},
      tags: {dType: "Array", arrayOf: "String", innerValidate: {min: 2}},
      mixed: {dType: "Array", arrayOf: ["String", "Number", "Boolean", "Generic"], innerValidate: {presence: true}},
      address: {
        street: {dType: "String"},
      },
      inlineContract: {dType: "Contract", contract: {city: {dType: "String"}}},
      inlineItems: {dType: "Array", arrayOf: {plz: {dType: "String"}}},
    })

    const buildAndUseContract = () => {
      const contract = new ContractBase({schema})
      contract.assign({
        name: "Kirill",
        tags: ["ab", "cd"],
        mixed: ["text", 42, true, null],
        address: {street: "Uhlandstr."},
        inlineContract: {city: "Berlin"},
        inlineItems: [{plz: "10437"}],
      })
      contract.isValid()
      contract.isValid("someContext") // twice, with context - inner validations run again
      contract.toObject()
      return contract
    }

    expect(buildAndUseContract).not.toThrow()

    // the same frozen schema is usable for multiple instances without interference
    const contractA = buildAndUseContract()
    const contractB = buildAndUseContract()
    expect(contractA.isValid()).toBe(contractB.isValid())
  })
})
