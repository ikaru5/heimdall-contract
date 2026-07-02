/**
 * Type tests - compiled by `npm run test:types` against the generated .d.ts files
 * (run `npm run build:types` first). Not executed, only type-checked.
 *
 * Positive cases must compile, negative cases assert an error via @ts-expect-error:
 * if the marked line stops erroring, tsc reports an unused @ts-expect-error and the check fails.
 */

import ContractBase, {SchemaError} from "../index.js"
import type {PropertyDefinition, Schema} from "../types.js"

// ---------------------------------------------------------------------------------------
// custom validations extend PropertyDefinition through declaration merging
// (consumers augment "@ikaru5/heimdall-contract/types" instead of the relative path)
// ---------------------------------------------------------------------------------------

declare module "../types.js" {
  interface PropertyDefinition {
    mustBeCool?: boolean
  }
}

// ---------------------------------------------------------------------------------------
// the documented consumer pattern: subclass, declare fields, annotate defineSchema
// ---------------------------------------------------------------------------------------

class AddressContract extends ContractBase {
  declare street: string
  declare city: string

  defineSchema(): Schema {
    return {
      street: {dType: "String", presence: true},
      city: {dType: "String", presence: true},
    }
  }
}

class SignupContract extends ContractBase {
  declare email: string
  declare username: string
  declare tags: Array<string>

  defineSchema(): Schema {
    return {
      ...super.defineSchema(),
      email: {dType: "String", presence: true, isEmail: true, _label: "E-Mail"},
      username: {dType: "String", min: (value, contract) => 8, allowBlank: false, mustBeCool: true},
      tags: {dType: "Array", arrayOf: "String", innerValidate: {min: 2}, on: ["signup", "profile"]},
      mixed: {dType: "Array", arrayOf: ["String", "Number"]},
      address: {dType: "Contract", contract: AddressContract},
      inlineAddress: {dType: "Contract", contract: {plz: {dType: "String", match: /^[0-9]{5}$/}}},
      nested: {
        deeper: {dType: "Boolean", only: true, errorMessage: {only: "must be accepted", default: (value) => "invalid"}},
      },
      passwordRepeat: {
        dType: "String",
        validate: (value, contract) => value === contract.password ? true : "passwords do not match",
        validateIf: (value, contract) => Boolean(contract.password),
      },
    }
  }
}

// ---------------------------------------------------------------------------------------
// public API surface
// ---------------------------------------------------------------------------------------

const contract = new SignupContract()
const email: string = contract.email

const validNoContext: boolean = contract.isValid()
const validSingle: boolean = contract.isValid("signup")
const validMulti: boolean = contract.isValid(["signup", "profile"])

contract.assign({email: "some@valid.com", tags: ["ab", "cd"]})
const rendered: Record<string, unknown> = contract.toObject()
const messages: Array<string> | undefined = contract.errors.email && !Array.isArray(contract.errors.email) ? contract.errors.email.messages : undefined

const inline = new ContractBase({schema: {name: {dType: "String"}}, strictSchema: false, ignoreUnderscoredFields: true})

const schemaError = new SchemaError(["some problem"])
const problems: Array<string> = schemaError.problems
const isError: Error = schemaError

// ---------------------------------------------------------------------------------------
// negative cases
// ---------------------------------------------------------------------------------------

// @ts-expect-error - unknown validation keyword (typo of presence)
const typoKeyword: PropertyDefinition = {dType: "String", presense: true}

// @ts-expect-error - invalid dType
const typoDtype: PropertyDefinition = {dType: "Strng"}

// @ts-expect-error - dType is required in a field definition
const missingDtype: PropertyDefinition = {presence: true}

// @ts-expect-error - min expects a number or a function returning a number
const wrongMinType: PropertyDefinition = {dType: "String", min: "8"}

// @ts-expect-error - arrayOf must not mix basic dTypes and contracts
const mixedArrayOf: PropertyDefinition = {dType: "Array", arrayOf: ["String", AddressContract]}

// @ts-expect-error - context must be a string or an array of strings
contract.isValid(42)

// @ts-expect-error - schema nodes must be field definitions or nested schema objects
const brokenNode: Schema = {name: "String"}

class TypoContract extends ContractBase {
  defineSchema(): Schema {
    return {
      // @ts-expect-error - typo in a validation keyword inside defineSchema
      email: {dType: "String", presense: true},
    }
  }
}

export {}
