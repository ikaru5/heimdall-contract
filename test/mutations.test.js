import {describe, expect, it} from '@jest/globals'
import ContractBase from "../index.js"

class CartContract extends ContractBase {
  defineSchema() {
    return (
      {
        ...super.defineSchema(),
        ...{
          name: {dType: "String"},
          items: {dType: "Array", arrayOf: "String"},
          address: {
            street: {dType: "String"},
            city: {dType: "String"}
          }
        }
      }
    )
  }
}

const collect = (contract) => {
  const paths = []
  const unsubscribe = contract.subscribeMutations(({path}) => paths.push(path))
  return {paths, unsubscribe}
}

describe("mutation subscriptions (explicit API only)", () => {
  it("notifies on setValueAtPath with the written path", () => {
    const contract = new CartContract()
    const {paths} = collect(contract)

    contract.setValueAtPath(["name"], "groceries")
    contract.setValueAtPath(["address", "city"], "Dresden")

    expect(paths).toEqual(["name", "address.city"])
  })

  it("notifies through assign, including array truncation", () => {
    const contract = new CartContract()
    contract.assign({items: ["a", "b"]})
    const {paths} = collect(contract)

    contract.assign({name: "assigned", items: ["only"]})

    expect(paths).toContain("name")
    expect(paths).toContain("items.0")
    expect(paths).toContain("items") // truncation from 2 to 1 elements
    expect(contract.toObject().items).toEqual(["only"])
  })

  it("notifies validation runs once on the errors path", () => {
    const contract = new CartContract()
    const {paths} = collect(contract)

    contract.isValid()

    // internal error bookkeeping is silent - one summary notification instead
    expect(paths).toEqual(["errors"])
  })

  it("bubbles nested contract mutations with the CURRENT prefix", () => {
    class ChildContract extends ContractBase {
      defineSchema() {
        return ({...super.defineSchema(), ...{note: {dType: "String"}}})
      }
    }
    class ParentContract extends ContractBase {
      defineSchema() {
        return ({
          ...super.defineSchema(),
          ...{
            child: {dType: "Contract", contract: ChildContract},
            kids: {dType: "Array", arrayOf: [ChildContract]}
          }
        })
      }
    }

    const parent = new ParentContract()
    parent.assign({kids: [{arrayElementType: "ChildContract", note: "k0"}, {arrayElementType: "ChildContract", note: "k1"}]})
    const firstKid = parent.kids[0]
    parent.kids.reverse()

    const {paths} = collect(parent)
    parent.child.setValueAtPath(["note"], "hello")
    firstKid.setValueAtPath(["note"], "moved")

    // located at mutation time: "k0" now lives at index 1
    expect(paths).toEqual(["child.note", "kids.1.note"])
  })

  it("deliberately does NOT observe raw writes - contracts stay plain value holders", () => {
    const contract = new CartContract()
    const {paths} = collect(contract)

    contract.name = "raw write"
    contract.items.push("raw push")
    contract.address.street = "raw nested"

    // reactive editing belongs to an adapter's store API (setValue), not to
    // the contract - see subscribeMutations docs
    expect(paths).toEqual([])
    expect(contract.name).toEqual("raw write") // values still land, of course
  })

  it("keeps the observer plumbing out of enumeration - JSON.stringify stays acyclic", () => {
    const contract = new CartContract()
    contract.subscribeMutations(() => {})

    // _parent backlinks on nested contracts would make this throw "circular structure"
    const serialized = JSON.stringify(contract)

    expect(serialized).not.toContain("_parent")
    expect(serialized).not.toContain("_mutationSubscribers")
    expect(Object.keys(contract.address)).not.toContain("_parent")
  })

  it("supports unsubscribe and isolates throwing subscribers", () => {
    const contract = new CartContract()
    const seen = []
    contract.subscribeMutations(() => { throw new Error("boom") })
    const unsubscribe = contract.subscribeMutations(({path}) => seen.push(path))

    contract.setValueAtPath(["name"], "first")
    unsubscribe()
    contract.setValueAtPath(["name"], "second")

    expect(seen).toEqual(["name"])
  })
})
