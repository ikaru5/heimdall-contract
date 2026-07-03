import {describe, expect, it, jest} from '@jest/globals';
import ContractBase, {SchemaError} from "../index.js"

describe("schema linting", () => {

  describe("SchemaError", () => {
    it('is an Error carrying all problems', () => {
      const error = new SchemaError(["problem one", "problem two"])
      expect(error).toBeInstanceOf(Error)
      expect(error.name).toEqual("SchemaError")
      expect(error.problems).toStrictEqual(["problem one", "problem two"])
      expect(error.message).toContain("problem one")
      expect(error.message).toContain("problem two")
    })
  })

  describe("structural linting at construction time", () => {
    it('throws on an invalid dType', () => {
      expect(() => new ContractBase({schema: {name: {dType: "Strng"}}})).toThrow(SchemaError)
      expect(() => new ContractBase({schema: {name: {dType: "Strng"}}})).toThrow(/invalid dType "Strng" at "name"/)
    })

    it('throws on a missing arrayOf', () => {
      expect(() => new ContractBase({schema: {items: {dType: "Array"}}})).toThrow(/missing "arrayOf" for dType "Array" at "items"/)
    })

    it('throws on an invalid arrayOf string', () => {
      expect(() => new ContractBase({schema: {items: {dType: "Array", arrayOf: "Strng"}}})).toThrow(/invalid arrayOf "Strng" at "items"/)
    })

    it('throws on an empty arrayOf array', () => {
      expect(() => new ContractBase({schema: {items: {dType: "Array", arrayOf: []}}})).toThrow(/must not be an empty array/)
    })

    it('throws on an invalid entry in a mixed basic arrayOf', () => {
      expect(() => new ContractBase({schema: {items: {dType: "Array", arrayOf: ["String", "Numbr"]}}})).toThrow(/invalid arrayOf entry "Numbr" at "items"/)
    })

    it('throws when arrayOf mixes basic dTypes and contracts', () => {
      class ItemContract extends ContractBase {
        defineSchema() {
          return {name: {dType: "String"}}
        }
      }
      expect(() => new ContractBase({schema: {items: {dType: "Array", arrayOf: ["String", ItemContract]}}})).toThrow(/must contain either only basic dTypes or only contracts/)
    })

    it('throws on a completely invalid arrayOf', () => {
      expect(() => new ContractBase({schema: {items: {dType: "Array", arrayOf: 42}}})).toThrow(/invalid "arrayOf" at "items"/)
    })

    it('throws on a missing contract for dType Contract', () => {
      expect(() => new ContractBase({schema: {address: {dType: "Contract"}}})).toThrow(/missing "contract" for dType "Contract" at "address"/)
    })

    it('throws on an invalid contract config', () => {
      expect(() => new ContractBase({schema: {address: {dType: "Contract", contract: "AddressContract"}}})).toThrow(/"contract" at "address" must be a contract class or a schema object/)
    })

    it('throws on arrayOf, innerValidate or contract on unsupported dTypes', () => {
      expect(() => new ContractBase({schema: {name: {dType: "String", arrayOf: "String"}}})).toThrow(/"arrayOf" at "name" is only supported on dType "Array"/)
      expect(() => new ContractBase({schema: {name: {dType: "String", innerValidate: {min: 3}}}})).toThrow(/"innerValidate" at "name" is only supported on dType "Array"/)
      expect(() => new ContractBase({schema: {name: {dType: "String", contract: ContractBase}}})).toThrow(/"contract" at "name" is only supported on dType "Contract"/)
    })

    it('throws on a non-object innerValidate', () => {
      expect(() => new ContractBase({schema: {items: {dType: "Array", arrayOf: "String", innerValidate: "min"}}})).toThrow(/"innerValidate" at "items" must be an object/)
    })

    it('throws when validate or validateIf are not functions', () => {
      expect(() => new ContractBase({schema: {name: {dType: "String", validate: "not a function"}}})).toThrow(/"validate" at "name" must be a function/)
      expect(() => new ContractBase({schema: {name: {dType: "String", validateIf: "not a function"}}})).toThrow(/"validateIf" at "name" must be a function/)
    })

    it('throws on schema nodes that are no objects', () => {
      expect(() => new ContractBase({schema: {name: "String"}})).toThrow(/"name" must be a property config or a nested schema object/)
      expect(() => new ContractBase({schema: {name: null}})).toThrow(SchemaError)
      expect(() => new ContractBase({schema: {name: ["String"]}})).toThrow(SchemaError)
    })

    it('reports nested paths', () => {
      expect(() => new ContractBase({schema: {user: {address: {street: {dType: "Strng"}}}}})).toThrow(/at "user.address.street"/)
    })

    it('lints inline schemas of arrayOf and contract upfront', () => {
      expect(() => new ContractBase({schema: {items: {dType: "Array", arrayOf: {street: {dType: "Strng"}}}}})).toThrow(/invalid dType "Strng" at "items.street"/)
      expect(() => new ContractBase({schema: {address: {dType: "Contract", contract: {street: {dType: "Strng"}}}}})).toThrow(/invalid dType "Strng" at "address.street"/)
      expect(() => new ContractBase({schema: {items: {dType: "Array", arrayOf: [{street: {dType: "Strng"}}]}}})).toThrow(/invalid dType "Strng" at "items.street"/)
    })

    it('collects all problems into a single error', () => {
      let thrownError = undefined
      try {
        new ContractBase({schema: {
          name: {dType: "Strng"},
          items: {dType: "Array"},
        }})
      } catch (error) {
        thrownError = error
      }

      expect(thrownError).toBeInstanceOf(SchemaError)
      expect(thrownError.problems).toHaveLength(2)
    })

    it('accepts all valid schema forms', () => {
      class ItemContract extends ContractBase {
        defineSchema() {
          return {name: {dType: "String"}, arrayElementType: {dType: "String"}}
        }
      }

      expect(() => new ContractBase({schema: {
        name: {dType: "String", presence: true, validate: () => true, validateIf: () => true},
        count: {dType: "Number", default: 5},
        active: {dType: "Boolean"},
        meta: {dType: "Generic"},
        tags: {dType: "Array", arrayOf: "String", innerValidate: {min: 2}},
        mixedBasic: {dType: "Array", arrayOf: ["String", "Number"]},
        items: {dType: "Array", arrayOf: ItemContract},
        mixedItems: {dType: "Array", arrayOf: [ItemContract]},
        inlineItems: {dType: "Array", arrayOf: {street: {dType: "String"}}},
        address: {dType: "Contract", contract: ItemContract},
        inlineAddress: {dType: "Contract", contract: {street: {dType: "String"}}},
        nested: {deeper: {dType: "String"}},
      }})).not.toThrow()
    })
  })

  describe("keyword linting at validation time", () => {
    it('throws on an unknown validation keyword on first isValid', () => {
      const contract = new ContractBase({schema: {name: {dType: "String", presense: true}}}) // note the typo
      expect(() => contract.isValid()).toThrow(SchemaError)
      expect(() => contract.isValid()).toThrow(/unknown validation "presense" at "name"/)
    })

    it('reports nested paths for unknown keywords', () => {
      const contract = new ContractBase({schema: {user: {name: {dType: "String", presense: true}}}})
      expect(() => contract.isValid()).toThrow(/unknown validation "presense" at "user.name"/)
    })

    it('throws when normal validations are used on Contract fields', () => {
      const contract = new ContractBase({schema: {address: {dType: "Contract", contract: {street: {dType: "String"}}, min: 3}}})
      expect(() => contract.isValid()).toThrow(/validation "min" at "address" is not supported on Contract fields/)
    })

    it('throws when custom validate is used on Contract fields', () => {
      const contract = new ContractBase({schema: {address: {dType: "Contract", contract: {street: {dType: "String"}}, validate: () => true}}})
      expect(() => contract.isValid()).toThrow(/validation "validate" at "address" is not supported on Contract fields/)
    })

    it('allows breakers on Contract fields', () => {
      const contract = new ContractBase({schema: {address: {dType: "Contract", contract: {street: {dType: "String"}}, allowBlank: true, on: "contextA", validateIf: () => true}}})
      expect(() => contract.isValid()).not.toThrow()
    })

    it('throws on unknown keywords inside innerValidate of basic arrays', () => {
      const contract = new ContractBase({schema: {tags: {dType: "Array", arrayOf: "String", innerValidate: {mim: 2}}}})
      expect(() => contract.isValid()).toThrow(/unknown validation "mim" at "tags.innerValidate"/)
    })

    it('allows the full validation set inside innerValidate of basic arrays', () => {
      const contract = new ContractBase({schema: {tags: {dType: "Array", arrayOf: "String", innerValidate: {min: 2, allowBlank: true, validate: () => true, errorMessage: "custom"}}}})
      expect(() => contract.isValid()).not.toThrow()
    })

    it('throws on normal validations inside innerValidate of contract arrays', () => {
      const contract = new ContractBase({schema: {items: {dType: "Array", arrayOf: {name: {dType: "String"}}, innerValidate: {min: 2}}}})
      expect(() => contract.isValid()).toThrow(/validation "min" at "items.innerValidate" is not supported on contract arrays/)
    })

    it('allows breakers inside innerValidate of contract arrays', () => {
      const contract = new ContractBase({schema: {items: {dType: "Array", arrayOf: {name: {dType: "String"}}, innerValidate: {allowBlank: true, on: "contextA", validateIf: () => true}}}})
      expect(() => contract.isValid()).not.toThrow()
    })

    it('knows validation keywords inherited from the parent contract', () => {
      const isCool = {
        normal: {
          isCool: {
            check: ({value}) => "cool" === value,
            message: () => "is not cool",
          },
        }
      }

      class ParentContract extends ContractBase {
        addAdditionalValidations() {
          return isCool
        }

        defineSchema() {
          return {
            items: {dType: "Array", arrayOf: {name: {dType: "String", isCool: true}}},
          }
        }
      }

      // the inline nested contract does not know "isCool" itself, it inherits it through the parent on validation
      const parent = new ParentContract()
      parent.assign({items: [{name: "cool"}, {name: "uncool"}]})
      expect(parent.isValid()).toBe(false)
      expect(parent.errors).toStrictEqual({
        fields: {
          items: {elements: {"1": {fields: {name: {issues: [{validation: "isCool", message: "is not cool"}]}}}}}
        }
      })

      // a standalone contract with the same schema does not know "isCool" and reports it
      const standalone = new ContractBase({schema: {name: {dType: "String", isCool: true}}})
      expect(() => standalone.isValid()).toThrow(/unknown validation "isCool" at "name"/)
    })
  })

  describe("strictSchema switch", () => {
    it('logs structural problems instead of throwing when disabled via constructor options', () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {})
      let contract = undefined
      expect(() => {
        contract = new ContractBase({schema: {name: {dType: "Strng"}}, strictSchema: false})
      }).not.toThrow()
      expect(spy.mock.calls.flat().some(arg => typeof arg === "string" && arg.includes('invalid dType "Strng"'))).toBe(true)

      // the invalid dType falls back to Generic and can never be valid
      contract.name = "some value"
      expect(contract.isValid()).toBe(false)
      spy.mockRestore()
    })

    it('logs keyword problems instead of throwing when disabled via setConfig', () => {
      class LenientContract extends ContractBase {
        setConfig() {
          this.contractConfig.strictSchema = false
        }

        defineSchema() {
          return {name: {dType: "String", presense: true}}
        }
      }

      const spy = jest.spyOn(console, "error").mockImplementation(() => {})
      const contract = new LenientContract()
      contract.name = "some value"
      expect(contract.isValid()).toBe(true) // the unknown keyword is skipped
      expect(spy.mock.calls.flat().some(arg => typeof arg === "string" && arg.includes('unknown validation "presense"'))).toBe(true)
      spy.mockRestore()
    })

    it('skips structurally broken schema nodes everywhere when disabled', () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {})
      // the broken node is reported at construction time and must not crash define, assign, validate or render
      const contract = new ContractBase({schema: {name: "String", count: {dType: "Number"}}, strictSchema: false})
      contract.assign({name: "some value", count: 5})
      expect(() => contract.isValid()).not.toThrow()
      expect(contract.isValid()).toBe(true)
      expect(contract.toObject()).toStrictEqual({count: 5})
      spy.mockRestore()
    })

    it('passes strictSchema down to nested contracts during construction', () => {
      class BrokenChildContract extends ContractBase {
        defineSchema() {
          return {name: {dType: "Strng"}}
        }
      }

      class LenientParentContract extends ContractBase {
        setConfig() {
          this.contractConfig.strictSchema = false
        }

        defineSchema() {
          return {child: {dType: "Contract", contract: BrokenChildContract}}
        }
      }

      // the broken child is constructed during parent construction and must not throw
      const spy = jest.spyOn(console, "error").mockImplementation(() => {})
      expect(() => new LenientParentContract()).not.toThrow()
      expect(spy.mock.calls.flat().some(arg => typeof arg === "string" && arg.includes('invalid dType "Strng"'))).toBe(true)
      spy.mockRestore()

      // in strict mode the same nested contract throws
      expect(() => new BrokenChildContract()).toThrow(SchemaError)
    })
  })
})
