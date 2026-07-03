import {describe, expect, it} from '@jest/globals';
import ContractBase from "../../index.js"

describe("validation context", () => {
  class SubContextContract extends ContractBase {

    defineSchema() {
      return (
        {
          ...super.defineSchema(),
          ...{
            isSomething: {dType: "Boolean", only: true, on: "contextA"},
            numberWithoutContext: {dType: "Number", min: 10}
          }
        }
      )
    }

  }

  class ContextContract extends ContractBase {
    defineSchema() {
      return (
        {
          ...super.defineSchema(),
          ...{
            numberWithoutContext: {dType: "Number", min: 10},
            number: {dType: "Number", min: 10, on: "contextA"},
            string: {dType: "String", match: /^[a-zA-Z0-9\s]*$/, on: ["contextA", "contextB"]},
            addressSimple: {
              plz: {presence: true, dType: "String", on: "contextA"}
            },
            sub: {dType: "Contract", contract: SubContextContract, allowBlank: false, on: "contextB"},
            subsContractedWithInner: {dType: "Array", min: 3, arrayOf: SubContextContract, allowBlank: false, on: "contextB", innerValidate: {on: "contextB"}},
            subsContracted: {dType: "Array", min: 3, arrayOf: SubContextContract, allowBlank: false, on: "contextB"}
          }
        }
      )
    }
  }

  const invalidData = {
    numberWithoutContext: 5,
    number: 5,
    string: "Test- fswe 325",
    addressSimple: {
      plz: undefined
    },
    sub: {
      isSomething: false,
      numberWithoutContext: 5
    },
    subsContractedWithInner: [
      {
        isSomething: undefined,
        numberWithoutContext: 5
      },
      {
        isSomething: false,
        numberWithoutContext: 5
      }
    ],
    subsContracted: [
      {
        isSomething: undefined,
        numberWithoutContext: 5
      },
      {
        isSomething: false,
        numberWithoutContext: 5
      }
    ]
  }

  const validData = {
    numberWithoutContext: 10,
    number: 10,
    string: "Test 325",
    addressSimple: {
      plz: "12345"
    },
    sub: {
      isSomething: true,
      numberWithoutContext: 30
    },
    subsContractedWithInner: [
      {
        isSomething: true,
        numberWithoutContext: 50
      },
      {
        isSomething: true,
        numberWithoutContext: 50
      },
      {
        isSomething: true,
        numberWithoutContext: 50
      }
    ],
    subsContracted: [
      {
        isSomething: true,
        numberWithoutContext: 50
      },
      {
        isSomething: true,
        numberWithoutContext: 50
      },
      {
        isSomething: true,
        numberWithoutContext: 50
      }
    ]
  }

  it("is valid for any context if data is valid", () => {
    const contract = new ContextContract()
    contract.assign(validData)
    expect(contract.isValid("matchAnyContext")).toBe(true)
    expect(contract.errors).toStrictEqual({})

    expect(contract.isValid("contextA")).toBe(true)
    expect(contract.errors).toStrictEqual({})

    expect(contract.isValid("contextB")).toBe(true)
    expect(contract.errors).toStrictEqual({})

    expect(contract.isValid("contextC")).toBe(true)
    expect(contract.errors).toStrictEqual({})

    expect(contract.isValid(["contextA", "contextB"])).toBe(true)
  })

  it('validates only if context matched', () => {
    const contract = new ContextContract()
    contract.assign(invalidData)
    expect(contract.isValid("matchAnyContext")).toBe(false)
    expect(contract.errors).toStrictEqual({
      fields: {
        numberWithoutContext: {issues: [{validation: "min", message: "must be greater than or equal to 10"}]},
        number: {issues: [{validation: "min", message: "must be greater than or equal to 10"}]},
        string: {issues: [{validation: "match", message: "invalid"}]},
        addressSimple: {fields: {plz: {issues: [{validation: "presence", message: "not present"}]}}},
        sub: {
          fields: {
            isSomething: {issues: [{validation: "only", message: "must be \"true\""}]},
            numberWithoutContext: {issues: [{validation: "min", message: "must be greater than or equal to 10"}]}
          }
        },
        subsContractedWithInner: {
          issues: [{validation: "min", message: "must have at least 3 elements"}],
          elements: {
            "0": {
              fields: {
                isSomething: {issues: [{validation: "dType", message: "\"undefined\" is not a valid Boolean"}]},
                numberWithoutContext: {issues: [{validation: "min", message: "must be greater than or equal to 10"}]}
              }
            },
            "1": {
              fields: {
                isSomething: {issues: [{validation: "only", message: "must be \"true\""}]},
                numberWithoutContext: {issues: [{validation: "min", message: "must be greater than or equal to 10"}]}
              }
            }
          }
        },
        subsContracted: {
          issues: [{validation: "min", message: "must have at least 3 elements"}],
          elements: {
            "0": {
              fields: {
                isSomething: {issues: [{validation: "dType", message: "\"undefined\" is not a valid Boolean"}]},
                numberWithoutContext: {issues: [{validation: "min", message: "must be greater than or equal to 10"}]}
              }
            },
            "1": {
              fields: {
                isSomething: {issues: [{validation: "only", message: "must be \"true\""}]},
                numberWithoutContext: {issues: [{validation: "min", message: "must be greater than or equal to 10"}]}
              }
            }
          }
        }
      }
    })

    contract.numberWithoutContext = 10
    contract.subsContracted[0].numberWithoutContext = 10
    contract.subsContracted[1].numberWithoutContext = 10
    expect(contract.isValid()).toBe(true)
    expect(contract.errors).toStrictEqual({})
  })

  it('validates only for contextA', () => {
    const contract = new ContextContract()
    contract.assign(invalidData)
    expect(contract.isValid("contextA")).toBe(false)
    expect(contract.errors).toStrictEqual({
      fields: {
        numberWithoutContext: {issues: [{validation: "min", message: "must be greater than or equal to 10"}]},
        number: {issues: [{validation: "min", message: "must be greater than or equal to 10"}]},
        string: {issues: [{validation: "match", message: "invalid"}]},
        addressSimple: {fields: {plz: {issues: [{validation: "presence", message: "not present"}]}}},
        subsContracted: {
          elements: {
            "0": {
              fields: {
                isSomething: {issues: [{validation: "dType", message: "\"undefined\" is not a valid Boolean"}]},
                numberWithoutContext: {issues: [{validation: "min", message: "must be greater than or equal to 10"}]}
              }
            },
            "1": {
              fields: {
                isSomething: {issues: [{validation: "only", message: "must be \"true\""}]},
                numberWithoutContext: {issues: [{validation: "min", message: "must be greater than or equal to 10"}]}
              }
            }
          }
        }
      }
    })

  })

  it('validates only for contextB', () => {
    const contract = new ContextContract()
    contract.assign(invalidData)
    expect(contract.isValid("contextB")).toBe(false)
    expect(contract.errors).toStrictEqual({
      fields: {
        numberWithoutContext: {issues: [{validation: "min", message: "must be greater than or equal to 10"}]},
        string: {issues: [{validation: "match", message: "invalid"}]},
        sub: {
          fields: {
            numberWithoutContext: {issues: [{validation: "min", message: "must be greater than or equal to 10"}]}
          }
        },
        subsContractedWithInner: {
          issues: [{validation: "min", message: "must have at least 3 elements"}],
          elements: {
            "0": {
              fields: {
                numberWithoutContext: {issues: [{validation: "min", message: "must be greater than or equal to 10"}]}
              }
            },
            "1": {
              fields: {
                numberWithoutContext: {issues: [{validation: "min", message: "must be greater than or equal to 10"}]}
              }
            }
          }
        },
        subsContracted: {
          issues: [{validation: "min", message: "must have at least 3 elements"}],
          elements: {
            "0": {
              fields: {
                numberWithoutContext: {issues: [{validation: "min", message: "must be greater than or equal to 10"}]}
              }
            },
            "1": {
              fields: {
                numberWithoutContext: {issues: [{validation: "min", message: "must be greater than or equal to 10"}]}
              }
            }
          }
        }
      }
    })

  })

  it('validates for contextA and contextB', () => {
    const contract = new ContextContract()
    contract.assign(invalidData)
    expect(contract.isValid(["contextA", "contextB"])).toBe(false)
    expect(contract.errors).toStrictEqual({
      fields: {
        numberWithoutContext: {issues: [{validation: "min", message: "must be greater than or equal to 10"}]},
        number: {issues: [{validation: "min", message: "must be greater than or equal to 10"}]},
        string: {issues: [{validation: "match", message: "invalid"}]},
        addressSimple: {fields: {plz: {issues: [{validation: "presence", message: "not present"}]}}},
        sub: {
          fields: {
            isSomething: {issues: [{validation: "only", message: "must be \"true\""}]},
            numberWithoutContext: {issues: [{validation: "min", message: "must be greater than or equal to 10"}]}
          }
        },
        subsContractedWithInner: {
          issues: [{validation: "min", message: "must have at least 3 elements"}],
          elements: {
            "0": {
              fields: {
                isSomething: {issues: [{validation: "dType", message: "\"undefined\" is not a valid Boolean"}]},
                numberWithoutContext: {issues: [{validation: "min", message: "must be greater than or equal to 10"}]}
              }
            },
            "1": {
              fields: {
                isSomething: {issues: [{validation: "only", message: "must be \"true\""}]},
                numberWithoutContext: {issues: [{validation: "min", message: "must be greater than or equal to 10"}]}
              }
            }
          }
        },
        subsContracted: {
          issues: [{validation: "min", message: "must have at least 3 elements"}],
          elements: {
            "0": {
              fields: {
                isSomething: {issues: [{validation: "dType", message: "\"undefined\" is not a valid Boolean"}]},
                numberWithoutContext: {issues: [{validation: "min", message: "must be greater than or equal to 10"}]}
              }
            },
            "1": {
              fields: {
                isSomething: {issues: [{validation: "only", message: "must be \"true\""}]},
                numberWithoutContext: {issues: [{validation: "min", message: "must be greater than or equal to 10"}]}
              }
            }
          }
        }
      }
    })

  })

  it('validates for contextA and someDifferent context just like only for context A', () => {
    const contract = new ContextContract()
    contract.assign(invalidData)
    expect(contract.isValid(["contextA", "someDifferent"])).toBe(false)
    expect(contract.errors).toStrictEqual({
      fields: {
        numberWithoutContext: {issues: [{validation: "min", message: "must be greater than or equal to 10"}]},
        number: {issues: [{validation: "min", message: "must be greater than or equal to 10"}]},
        string: {issues: [{validation: "match", message: "invalid"}]},
        addressSimple: {fields: {plz: {issues: [{validation: "presence", message: "not present"}]}}},
        subsContracted: {
          elements: {
            "0": {
              fields: {
                isSomething: {issues: [{validation: "dType", message: "\"undefined\" is not a valid Boolean"}]},
                numberWithoutContext: {issues: [{validation: "min", message: "must be greater than or equal to 10"}]}
              }
            },
            "1": {
              fields: {
                isSomething: {issues: [{validation: "only", message: "must be \"true\""}]},
                numberWithoutContext: {issues: [{validation: "min", message: "must be greater than or equal to 10"}]}
              }
            }
          }
        }
      }
    })
  })
})