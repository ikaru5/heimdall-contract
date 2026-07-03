import {describe, expect, it} from '@jest/globals';
import ContractBase, {contractClass, SchemaError} from "../index.js"

describe("contractClass factory", () => {
  it('creates a working contract class from a schema', () => {
    const SignupContract = contractClass({
      email: {dType: "String", presence: true, isEmail: true},
      age: {dType: "Number", allowBlank: true},
      newsletter: {dType: "Boolean", allowBlank: true},
      tags: {dType: "Array", arrayOf: "String"},
    })

    const contract = new SignupContract()
    expect(contract).toBeInstanceOf(ContractBase)

    // default empty values like with a handwritten class
    expect(contract.email).toEqual("")
    expect(contract.age).toEqual(null)
    expect(contract.newsletter).toEqual(undefined)
    expect(contract.tags).toStrictEqual([])

    expect(contract.isValid()).toBe(false)
    expect(contract.errors).toStrictEqual({
      fields: {
        email: {
          issues: [
            {validation: "presence", message: "not present"},
            {validation: "isEmail", message: "must be a valid E-Mail"}
          ]
        }
      }
    })

    contract.assign({email: "some@valid.com", age: 30, newsletter: true, tags: ["a", "b"]})
    expect(contract.isValid()).toBe(true)
    expect(contract.toObject()).toStrictEqual({email: "some@valid.com", age: 30, newsletter: true, tags: ["a", "b"]})
  })

  it('inherits schema, config and additional validations from a base class', () => {
    class PersonContract extends ContractBase {
      addAdditionalValidations() {
        return {
          breaker: {},
          normal: {
            mustBeOliver: {
              check: ({value}) => "Oliver" === value,
              message: () => "is not Oliver",
            },
          },
        }
      }

      defineSchema() {
        return {
          ...super.defineSchema(),
          ...{name: {dType: "String", mustBeOliver: true}}
        }
      }
    }

    const EmployeeContract = contractClass({staffId: {dType: "Number", presence: true}}, PersonContract)

    const employee = new EmployeeContract()
    expect(employee).toBeInstanceOf(PersonContract)
    expect(employee.name).toEqual("")
    expect(employee.staffId).toEqual(null)

    employee.assign({name: "Rico", staffId: 5})
    expect(employee.isValid()).toBe(false)
    expect(employee.errors).toStrictEqual({fields: {name: {issues: [{validation: "mustBeOliver", message: "is not Oliver"}]}}})

    employee.name = "Oliver"
    expect(employee.isValid()).toBe(true)
  })

  it('can be extended like a handwritten class', () => {
    class SignupContract extends contractClass({email: {dType: "String", isEmail: true}}) {
      emailDomain() {
        return this.email.split("@")[1]
      }
    }

    const contract = new SignupContract()
    contract.assign({email: "kirill@example.com"})
    expect(contract.isValid()).toBe(true)
    expect(contract.emailDomain()).toEqual("example.com")
  })

  it('can be nested via dType Contract and arrayOf', () => {
    const AddressContract = contractClass({city: {dType: "String", presence: true}})
    const OrderContract = contractClass({
      address: {dType: "Contract", contract: AddressContract},
      previousAddresses: {dType: "Array", arrayOf: AddressContract},
    })

    const order = new OrderContract()
    order.assign({address: {city: "Berlin"}, previousAddresses: [{city: "Hamburg"}, {city: ""}]})
    expect(order.isValid()).toBe(false)
    expect(order.errors).toStrictEqual({
      fields: {
        previousAddresses: {elements: {"1": {fields: {city: {issues: [{validation: "presence", message: "not present"}]}}}}}
      }
    })
  })

  it('lints the schema like a handwritten class', () => {
    const BrokenContract = contractClass({name: {dType: "Strng"}})
    expect(() => new BrokenContract()).toThrow(SchemaError)
  })
})
