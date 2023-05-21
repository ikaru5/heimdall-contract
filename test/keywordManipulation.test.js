import {describe, expect, it} from '@jest/globals';
import ContractBase from "../index.js"

describe("keyword manipulation", () => {
  class TestContract extends ContractBase {
    defineSchema() {
      return (
        {
          ...super.defineSchema(),
          ...{
            asVal: {dType: "String", as: "asValA"},
            parseVal: {dType: "String", parseAs: "parseValA"},
            parseArrayVal: {dType: "String", parseAs: ["parseArrayValA", "parseArrayValB"]},
            renderVal: {dType: "String", renderAs: "renderValA"},
            renderArrayVal: {dType: "String", renderAs: ["renderArrayValA", "renderArrayValB"]},
            asParseVal: {dType: "String", as: "asParseValA", parseAs: "asParseValB"},
            asRenderVal: {dType: "String", as: "asRenderValA", renderAs: "asRenderValB"},
            parseRenderVal: {dType: "String", parseAs: "parseRenderValA", renderAs: "parseRenderValB"},
            asParseRenderVal: {dType: "String", as: "asParseRenderValA", parseAs: "asParseRenderValB", renderAs: "asParseRenderValC"},
          }
        }
      )
    }

  }

  it('it handles as', () => {
    const testContract = new TestContract()
    testContract.assign({
      asVal: "incorrectVal",
      asValA: "correctVal"
    })

    expect(testContract.asVal).toEqual("correctVal")
    expect(testContract.toObject().asVal).toEqual(undefined)
    expect(testContract.toObject().asValA).toEqual("correctVal")
  })

  it('it handles parseAs', () => {
    const testContract = new TestContract()
    testContract.assign({
      parseVal: "incorrectVal",
      parseValA: "correctVal"
    })

    expect(testContract.parseVal).toEqual("correctVal")
    expect(testContract.toObject().parseValA).toEqual(undefined)
    expect(testContract.toObject().parseVal).toEqual("correctVal")
  })

  it('it handles parseAs array', () => {
    let testContract = new TestContract()
    testContract.assign({
      parseArrayVal: "incorrectVal",
      parseArrayValA: "correctValA",
      parseArrayValB: "incorrectVal"
    })

    expect(testContract.parseArrayVal).toEqual("correctValA")
    expect(testContract.toObject().parseArrayValA).toEqual(undefined)
    expect(testContract.toObject().parseArrayValB).toEqual(undefined)
    expect(testContract.toObject().parseArrayVal).toEqual("correctValA")

    testContract = new TestContract()
    testContract.assign({
      parseArrayVal: "incorrectVal",
      parseArrayValB: "correctValB"
    })
    expect(testContract.parseArrayVal).toEqual("correctValB")
    expect(testContract.toObject().parseArrayValA).toEqual(undefined)
    expect(testContract.toObject().parseArrayValB).toEqual(undefined)
    expect(testContract.toObject().parseArrayVal).toEqual("correctValB")
  })

  it('it handles renderAs', () => {
    const testContract = new TestContract()
    testContract.assign({
      renderVal: "correctVal",
      renderValA: "incorrectVal"
    })

    expect(testContract.renderVal).toEqual("correctVal")
    expect(testContract.toObject().renderValA).toEqual("correctVal")
    expect(testContract.toObject().renderVal).toEqual(undefined)
  })

  it('it handles renderAs array', () => {
    const testContract = new TestContract()
    testContract.assign({
      renderArrayVal: "correctVal",
      renderArrayValA: "incorrectVal",
      renderArrayValB: "incorrectVal"
    })

    expect(testContract.renderArrayVal).toEqual("correctVal")
    expect(testContract.toObject().renderArrayVal).toEqual(undefined)
    expect(testContract.toObject().renderArrayValA).toEqual("correctVal")
    expect(testContract.toObject().renderArrayValB).toEqual(undefined)
  })

  it('it handles as and parseAs', () => {
    const testContract = new TestContract()
    testContract.assign({
      asParseVal: "incorrectVal",
      asParseValA: "incorrectVal",
      asParseValB: "correctVal"
    })

    expect(testContract.asParseVal).toEqual("correctVal")
    expect(testContract.toObject().asParseVal).toEqual(undefined)
    expect(testContract.toObject().asParseValA).toEqual("correctVal")
    expect(testContract.toObject().asParseValB).toEqual(undefined)
  })

  it('it handles as and renderAs', () => {
    const testContract = new TestContract()
    testContract.assign({
      asRenderVal: "incorrectVal",
      asRenderValA: "correctVal",
      asRenderValB: "incorrectVal"
    })

    expect(testContract.asRenderVal).toEqual("correctVal")
    expect(testContract.toObject().asRenderVal).toEqual(undefined)
    expect(testContract.toObject().asRenderValA).toEqual(undefined)
    expect(testContract.toObject().asRenderValB).toEqual("correctVal")
  })

  it('it handles parseAs and renderAs', () => {
    const testContract = new TestContract()
    testContract.assign({
      parseRenderVal: "incorrectVal",
      parseRenderValA: "correctVal",
      parseRenderValB: "incorrectVal"
    })

    expect(testContract.parseRenderVal).toEqual("correctVal")
    expect(testContract.toObject().parseRenderVal).toEqual(undefined)
    expect(testContract.toObject().parseRenderValA).toEqual(undefined)
    expect(testContract.toObject().parseRenderValB).toEqual("correctVal")
  })

  it('it handles as, parseAs and renderAs', () => {
    const testContract = new TestContract()
    testContract.assign({
      asParseRenderVal: "incorrectVal",
      asParseRenderValA: "incorrectVal",
      asParseRenderValB: "correctVal",
      asParseRenderValC: "incorrectVal"
    })

    expect(testContract.asParseRenderVal).toEqual("correctVal")
    expect(testContract.toObject().asParseRenderVal).toEqual(undefined)
    expect(testContract.toObject().asParseRenderValA).toEqual(undefined)
    expect(testContract.toObject().asParseRenderValB).toEqual(undefined)
    expect(testContract.toObject().asParseRenderValC).toEqual("correctVal")
  })
})