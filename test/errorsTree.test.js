import {describe, expect, it} from '@jest/globals';
import ContractBase, {contractClass} from "../index.js"

describe("errors tree structure", () => {
  const AddressContract = contractClass({
    street: {dType: "String", presence: true},
    city: {dType: "String", presence: true},
  })

  const OrderContract = contractClass({
    email: {dType: "String", presence: true, isEmail: true},
    address: {dType: "Contract", contract: AddressContract},
    items: {dType: "Array", arrayOf: "String", min: 3, innerValidate: {min: 2}},
    contacts: {dType: "Array", arrayOf: AddressContract},
  })

  const buildInvalidOrder = () => {
    const order = new OrderContract()
    order.assign({
      email: "not-an-email",
      address: {street: "", city: "Berlin"},
      items: ["a", "bb"],
      contacts: [{street: "ok", city: "Berlin"}, {street: "", city: ""}],
    })
    order.isValid()
    return order
  }

  it("separates own issues, fields and elements into distinct namespaces", () => {
    const order = buildInvalidOrder()

    // own issue of a scalar field
    expect(order.errors.fields.email.issues).toStrictEqual([
      {validation: "isEmail", message: "must be a valid E-Mail"}
    ])

    // nested contract errors live under fields, arbitrarily deep
    expect(order.errors.fields.address.fields.street.issues).toStrictEqual([
      {validation: "presence", message: "not present"}
    ])

    // an array field carries its own outer issues next to per-element errors, cleanly separated
    expect(order.errors.fields.items.issues).toStrictEqual([
      {validation: "min", message: "must have at least 3 elements"}
    ])
    expect(order.errors.fields.items.elements[0].issues).toStrictEqual([
      {validation: "min", message: "must have at least 2 characters"}
    ])
    expect(order.errors.fields.items.elements[1]).toBeUndefined() // "bb" is long enough

    // contract array elements nest their own field errors under elements
    expect(order.errors.fields.contacts.elements[1].fields.street.issues).toStrictEqual([
      {validation: "presence", message: "not present"}
    ])
    expect(order.errors.fields.contacts.elements[0]).toBeUndefined()
  })

  it("uses no reserved field name - a field literally named 'messages' is fine", () => {
    const contract = contractClass({
      messages: {dType: "String", presence: true},
    })
    const instance = new contract()
    instance.isValid()
    expect(instance.errors.fields.messages.issues).toStrictEqual([
      {validation: "presence", message: "not present"}
    ])
  })

  it("has empty errors when valid", () => {
    const order = new OrderContract()
    order.assign({
      email: "some@valid.com",
      address: {street: "Uhlandstr.", city: "Berlin"},
      items: ["aa", "bb", "cc"],
      contacts: [],
    })
    expect(order.isValid()).toBe(true)
    expect(order.errors).toStrictEqual({})
  })
})

describe("errorsAt", () => {
  const Contract = contractClass({
    name: {dType: "String", presence: true},
    address: {dType: "Contract", contract: {street: {dType: "String", presence: true}}},
    tags: {dType: "Array", arrayOf: "String", innerValidate: {min: 2}},
  })

  const build = () => {
    const contract = new Contract()
    contract.assign({name: "", address: {street: ""}, tags: ["a"]})
    contract.isValid()
    return contract
  }

  it("returns the error node at a dotted path", () => {
    const contract = build()
    expect(contract.errorsAt("name").issues).toStrictEqual([{validation: "presence", message: "not present"}])
    expect(contract.errorsAt("address.street").issues).toStrictEqual([{validation: "presence", message: "not present"}])
  })

  it("accepts an array path and addresses array elements by index", () => {
    const contract = build()
    expect(contract.errorsAt(["tags", 0]).issues).toStrictEqual([{validation: "min", message: "must have at least 2 characters"}])
    expect(contract.errorsAt("tags.0").issues).toStrictEqual([{validation: "min", message: "must have at least 2 characters"}])
  })

  it("returns undefined for paths without errors", () => {
    const contract = build()
    expect(contract.errorsAt("address.city")).toBeUndefined()
    expect(contract.errorsAt("tags.5")).toBeUndefined()
    expect(contract.errorsAt("doesNotExist.deep.path")).toBeUndefined()
  })
})

describe("flatErrors", () => {
  it("flattens the whole tree into path/validation/message entries", () => {
    const Contract = contractClass({
      email: {dType: "String", presence: true, isEmail: true},
      address: {dType: "Contract", contract: {street: {dType: "String", presence: true}}},
      items: {dType: "Array", arrayOf: "String", min: 3, innerValidate: {min: 2}},
    })
    const contract = new Contract()
    contract.assign({email: "", address: {street: ""}, items: ["a"]})
    contract.isValid()

    expect(contract.flatErrors()).toStrictEqual([
      {path: ["email"], validation: "presence", message: "not present"},
      {path: ["email"], validation: "isEmail", message: "must be a valid E-Mail"},
      {path: ["address", "street"], validation: "presence", message: "not present"},
      {path: ["items"], validation: "min", message: "must have at least 3 elements"},
      {path: ["items", 0], validation: "min", message: "must have at least 2 characters"},
    ])
  })

  it("returns an empty list when there are no errors", () => {
    const contract = contractClass({name: {dType: "String"}})
    const instance = new contract()
    instance.isValid()
    expect(instance.flatErrors()).toStrictEqual([])
  })
})
