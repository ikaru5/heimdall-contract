/**
 * Type tests for schema type inference - see typetest/contract.test-d.ts for how these work.
 */

import ContractBase, {contractClass} from "../index.js"
import type {InferContract, Schema} from "../types.js"

// ---------------------------------------------------------------------------------------
// contractClass: fields are inferred from the schema
// ---------------------------------------------------------------------------------------

const AddressContract = contractClass({
  street: {dType: "String", presence: true},
  city: {dType: "String", presence: true},
})

const SignupContract = contractClass({
  email: {dType: "String", presence: true, isEmail: true},
  age: {dType: "Number"},
  newsletter: {dType: "Boolean"},
  meta: {dType: "Generic"},
  tags: {dType: "Array", arrayOf: "String"},
  scores: {dType: "Array", arrayOf: ["String", "Number"]},
  address: {dType: "Contract", contract: AddressContract},
  addresses: {dType: "Array", arrayOf: AddressContract},
  inline: {dType: "Contract", contract: {plz: {dType: "String"}}},
  nested: {
    deeper: {dType: "Boolean"},
  },
})

const contract = new SignupContract()

// dType mapping mirrors the runtime default values
const email: string = contract.email
const age: number | null = contract.age
const newsletter: boolean | undefined = contract.newsletter
const tags: Array<string> = contract.tags
const scores: Array<string | number> = contract.scores
const street: string = contract.address.street
const nestedAddressCity: string = contract.addresses[0].city
const inlinePlz: string = contract.inline.plz
const deeper: boolean | undefined = contract.nested.deeper

// the contract API is present alongside the inferred fields
const valid: boolean = contract.isValid()
contract.address.isValid()

// ---------------------------------------------------------------------------------------
// toObject() is inferred including nested contracts and key remapping
// ---------------------------------------------------------------------------------------

const rendered = contract.toObject()
const renderedEmail: string = rendered.email
const renderedAge: number | null = rendered.age
const renderedTags: Array<string> = rendered.tags
const renderedAddress: {street: string, city: string} = rendered.address
const renderedAddresses: Array<{street: string, city: string}> = rendered.addresses
const renderedInlinePlz: string = rendered.inline.plz
const renderedDeeper: boolean | undefined = rendered.nested.deeper

// @ts-expect-error - rendered email is a string, not a number
const renderedWrong: number = rendered.email

// renderAs and as remap the output keys, renderAs wins over as
const RemappedContract = contractClass({
  internal: {dType: "String", renderAs: "external"},
  aliased: {dType: "Number", as: "wire", default: 0},
  both: {dType: "String", as: "asKey", renderAs: "renderKey"},
  multi: {dType: "String", renderAs: ["primary", "fallback"] as const},
})
const remapped = new RemappedContract().toObject()
const external: string = remapped.external
const wire: number = remapped.wire
const renderKey: string = remapped.renderKey
const primary: string = remapped.primary

// @ts-expect-error - the schema key is remapped away in the output
remapped.internal

// ---------------------------------------------------------------------------------------
// the errors tree is typed: fields keys autocomplete, nested and array errors compose
// ---------------------------------------------------------------------------------------

const emailIssues = contract.errors.fields?.email?.issues
const streetIssues = contract.errors.fields?.address?.fields?.street?.issues
const tagElementIssues = contract.errors.fields?.tags?.elements?.[0]?.issues
const contactFieldIssues = contract.errors.fields?.addresses?.elements?.[0]?.fields?.street?.issues
const issueValidation: string | undefined = contract.errors.fields?.email?.issues?.[0].validation

// errorsAt and flatErrors are typed
const nodeAt = contract.errorsAt("address.street")
const nodeAtIssues = nodeAt?.issues
const flat = contract.flatErrors()
const flatPath: Array<string | number> = flat[0].path
const flatMessage: string = flat[0].message
const flatValidation: string = flat[0].validation

// @ts-expect-error - email is a string, not a number
const wrongFieldType: number = contract.email

// @ts-expect-error - unknown fields stay unknown
contract.doesNotExist

// ---------------------------------------------------------------------------------------
// default values narrow the inferred type: the empty value can never occur
// ---------------------------------------------------------------------------------------

const WithDefaults = contractClass({
  agb: {dType: "Boolean", default: false, only: true},
  count: {dType: "Number", default: 0},
  plainFlag: {dType: "Boolean"},
  nullDefault: {dType: "Number", default: null},
})
const withDefaults = new WithDefaults()

const agb: boolean = withDefaults.agb     // narrowed - no undefined
const count: number = withDefaults.count  // narrowed - no null

// @ts-expect-error - without a default, undefined stays in the union
const plainFlag: boolean = withDefaults.plainFlag

// @ts-expect-error - a null default is not a number and does not narrow
const nullDefault: number = withDefaults.nullDefault

// ---------------------------------------------------------------------------------------
// contractClass: inheritance via base class merges the inferred fields
// ---------------------------------------------------------------------------------------

const EmployeeContract = contractClass({staffId: {dType: "Number"}}, SignupContract)
const employee = new EmployeeContract()
const employeeEmail: string = employee.email
const staffId: number | null = employee.staffId

// toObject() merges the rendered types across the inheritance chain
const employeeRendered = employee.toObject()
const employeeRenderedStaffId: number | null = employeeRendered.staffId
const employeeRenderedEmail: string = employeeRendered.email

// extending the returned class keeps fields and allows custom members
class ExtendedContract extends contractClass({name: {dType: "String"}}) {
  shout(): string {
    return this.name.toUpperCase()
  }
}
const extended = new ExtendedContract()
const shouted: string = extended.shout()

// ---------------------------------------------------------------------------------------
// declaration merging bridge for handwritten classes
// ---------------------------------------------------------------------------------------

const profileSchema = {
  username: {dType: "String", presence: true},
  visits: {dType: "Number"},
} satisfies Schema

interface ProfileContract extends InferContract<typeof profileSchema> {}
class ProfileContract extends ContractBase {
  defineSchema(): Schema {
    return {...super.defineSchema(), ...profileSchema}
  }
}

const profile = new ProfileContract()
const username: string = profile.username
const visits: number | null = profile.visits

// ---------------------------------------------------------------------------------------
// schema problems are caught at the factory boundary
// ---------------------------------------------------------------------------------------

// @ts-expect-error - unknown validation keyword (typo of presence)
contractClass({email: {dType: "String", presense: true}})

// @ts-expect-error - invalid dType
contractClass({email: {dType: "Strng"}})

// innerValidate keywords are checked like the runtime keyword lint does
contractClass({tags: {dType: "Array", arrayOf: "String", innerValidate: {min: 2, presence: true, validate: () => true, _meta: "x"}}})
contractClass({mixed: {dType: "Array", arrayOf: ["String", "Number"], innerValidate: {min: 1}}})
contractClass({items: {dType: "Array", arrayOf: AddressContract, innerValidate: {allowBlank: true, on: "ctx", validateIf: () => true, _meta: "x"}}})

// @ts-expect-error - typo inside innerValidate of a basic array
contractClass({tags: {dType: "Array", arrayOf: "String", innerValidate: {mim: 2}}})

// @ts-expect-error - normal validations are not supported in innerValidate of contract arrays
contractClass({items: {dType: "Array", arrayOf: AddressContract, innerValidate: {min: 2}}})

export {}
