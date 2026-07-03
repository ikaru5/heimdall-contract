import {describe, expect, it} from '@jest/globals';
import ContractBase from "../index.js"

describe("extend validations", () => {
  const validationsWithOliver = {
    normal: {
      mustBeOliver: {
        check: ({value, config: isRequired, dType, depth, contract}) => {
          return value === "Oliver"
        },
        message: ({value, config: dataType, dType, depth, contract}) => {
          return `"${value}" is not Oliver >:-(`
        }
      },
    }
  }

  const validationsWithRico = {
    normal: {
      mustBeRico: {
        check: ({value, config: isRequired, dType, depth, contract}) => {
          return value === "Rico"
        },
        message: ({value, config: dataType, dType, depth, contract}) => {
          return `"${value}" is not Rico >:-(`
        }
      },
    }
  }

  const validationsWithWrongRico = {
    normal: {
      mustBeRico: {
        check: ({value, config: isRequired, dType, depth, contract}) => {
          return value === "Wrong Rico"
        },
        message: ({value, config: dataType, dType, depth, contract}) => {
          return `"${value}" is not Wrong Rico >:-(`
        }
      },
    }
  }

  class Contract extends ContractBase {
    addAdditionalValidations() {
      return validationsWithOliver
    }
  }

  class NestedContractA extends Contract {
    addAdditionalValidations() {
      const superClassValidations = super.addAdditionalValidations()

      return {
        normal: { ...superClassValidations.normal, ...validationsWithRico.normal },
        breaker: { ...superClassValidations.breaker, ...validationsWithRico.breaker }
      }
    }

    defineSchema() {
      return (
        {
          ...super.defineSchema(),
          ...{
            street: {dType: "String", presence: true, mustBeRico: true},
            name: {dType: "String", presence: true, mustBeOliver: true},
          }
        }
      )
    }
  }

  class TestContract extends Contract {
    addAdditionalValidations() {
      const superClassValidations = super.addAdditionalValidations()

      return {
        normal: { ...superClassValidations.normal, ...validationsWithWrongRico.normal },
        breaker: { ...superClassValidations.breaker, ...validationsWithWrongRico.breaker }
      }
    }

    defineSchema() {
      return (
        {
          ...super.defineSchema(),
          ...{
            valueA: {dType: "String", mustBeOliver: true},
            valueB: {dType: "String", mustBeRico: true},
            nesting: {
              valueA: {dType: "String", mustBeOliver: true},
            },
            array: {
              dType: "Array",
              arrayOf: "String",
              min: 3,
              presence: true,
              innerValidate: {presence: true, min: 3, mustBeOliver: true},
              allowBlank: false
            },
            nestingContract: {dType: "Contract", contract: NestedContractA, allowBlank: false},
            nestingArrayContract: {dType: "Array", min: 3, arrayOf: NestedContractA, allowBlank: false},
            nestingArrayContractWithin: {
              dType: "Array", min: 3, arrayOf: {
                street: {dType: "String", presence: true, mustBeOliver: true},
              }
            },
          }
        }
      )
    }

  }

  it('handles most values with Rico', () => {
    const contract = new TestContract()
    contract.assign({
      valueA: "Rico",
      valueB: "Rico",
      nesting: { valueA: "Rico" },
      array: ["Rico", "Oliver"],
      nestingContract: { street: "Rico", name: "Rico" },
      nestingArrayContract: [
        { street: "Rico", name: "Rico" },
        { street: "Rico", name: "Rico" },
        { street: "Rico", name: "Oliver" }
      ],
      nestingArrayContractWithin: [ { street: "Rico" } ]
    })

    expect(contract.isValid()).toBe(false)
    expect(contract.errors).toStrictEqual({
      fields: {
        valueA: {issues: [{validation: "mustBeOliver", message: "\"Rico\" is not Oliver >:-("}]},
        valueB: {issues: [{validation: "mustBeRico", message: "\"Rico\" is not Wrong Rico >:-("}]},
        nesting: {fields: {valueA: {issues: [{validation: "mustBeOliver", message: "\"Rico\" is not Oliver >:-("}]}}},
        array: {
          issues: [{validation: "min", message: "must have at least 3 elements"}],
          elements: {"0": {issues: [{validation: "mustBeOliver", message: "\"Rico\" is not Oliver >:-("}]}}
        },
        nestingContract: {fields: {name: {issues: [{validation: "mustBeOliver", message: "\"Rico\" is not Oliver >:-("}]}}},
        nestingArrayContract: {
          elements: {
            "0": {fields: {name: {issues: [{validation: "mustBeOliver", message: "\"Rico\" is not Oliver >:-("}]}}},
            "1": {fields: {name: {issues: [{validation: "mustBeOliver", message: "\"Rico\" is not Oliver >:-("}]}}}
          }
        },
        nestingArrayContractWithin: {
          issues: [{validation: "min", message: "must have at least 3 elements"}],
          elements: {
            "0": {fields: {street: {issues: [{validation: "mustBeOliver", message: "\"Rico\" is not Oliver >:-("}]}}}
          }
        }
      }
    })
  })

  it('handles most values with Oliver', () => {
    const contract = new TestContract()
    contract.assign({
      valueA: "Oliver",
      valueB: "Oliver",
      nesting: { valueA: "Oliver" },
      array: ["Rico", "Oliver"],
      nestingContract: { street: "Oliver", name: "Oliver" },
      nestingArrayContract: [
        { street: "Oliver", name: "Oliver" },
        { street: "Oliver", name: "Oliver" },
        { street: "Rico", name: "Oliver" }
      ],
      nestingArrayContractWithin: [ { street: "Oliver" } ]
    })

    expect(contract.isValid()).toBe(false)
    expect(contract.errors).toStrictEqual({
      fields: {
        valueB: {issues: [{validation: "mustBeRico", message: "\"Oliver\" is not Wrong Rico >:-("}]},
        array: {
          issues: [{validation: "min", message: "must have at least 3 elements"}],
          elements: {"0": {issues: [{validation: "mustBeOliver", message: "\"Rico\" is not Oliver >:-("}]}}
        },
        nestingContract: {fields: {street: {issues: [{validation: "mustBeRico", message: "\"Oliver\" is not Rico >:-("}]}}},
        nestingArrayContract: {
          elements: {
            "0": {fields: {street: {issues: [{validation: "mustBeRico", message: "\"Oliver\" is not Rico >:-("}]}}},
            "1": {fields: {street: {issues: [{validation: "mustBeRico", message: "\"Oliver\" is not Rico >:-("}]}}}
          }
        },
        nestingArrayContractWithin: {issues: [{validation: "min", message: "must have at least 3 elements"}]}
      }
    })
  })
})