import ContractBase from "../index.js"

describe("validation", () => {
  class AddressContract extends ContractBase {

    defineSchema() {
      return (
        {
          ...super.defineSchema(),
          ...{
            street: { dType: "String", presence: true },
            streetNumber: { dType: "Number", presence: true },
            plz: { dType: "String", presence: true },
            city: { dType: "String", presence: true },
          }
        }
      )
    }

  }

  class SignupContract extends ContractBase {
    init() {
      this.className = "SignupContractExp"
    }

    defineSchema() {
      return (
        {
          ...super.defineSchema(),
          ...{
            email: { dType: "String", presence: true, isEmail: true, allowBlank: false },
            username: { dType: "String", presence: true, min: 8, allowBlank: false },
            password: { dType: "String", presence: true, min: 8, allowBlank: false },
            passwordRepeat: {
              dType: "String", presence: true,
              validate: (value, contract) => {
                return value === contract.password ? true : [false, "errors:passwordsNotMatching"]
              }
            },
            agb: {
              dType: "Boolean", default: false, only: true, errorMessage: "errors:mustBeAccepted",
              validateIf: (value, contract) => !contract.allowBlank
            },
            addressSimple: {
              street: { dType: "String", presence: true },
              streetNumber: { presence: true, dType: "Number" },
              plz: { presence: true, dType: "String" },
              city: { dType: "String", presence: true },
            },
            names: {
              dType: "Array",
              arrayOf: "String",
              min: 3,
              presence: true,
              innerValidate: { presence: true, min: 3, allowBlank: false },
              allowBlank: false
            },
            address: { dType: "Contract", contract: AddressContract, allowBlank: false },
            addressesContracted: { dType: "Array", min: 3, arrayOf: AddressContract, allowBlank: false },
            addressesContractedWithin: {
              dType: "Array", min: 3, arrayOf: {
                street: { dType: "String", presence: true },
                streetNumber: { presence: true, dType: "Number" },
                plz: { presence: true, dType: "String" },
                city: { dType: "String", presence: true }
              }
            },
          }
        }
      )
    }

  }

  it("validates empty complex contract", () => {
    const signUpContract = new SignupContract()

    const emptyObject =
      {
        email: '',
        username: '',
        password: '',
        passwordRepeat: '',
        agb: false,
        addressSimple: { street: '', streetNumber: null, plz: '', city: '' },
        names: [],
        address: { street: '', streetNumber: null, plz: '', city: '' },
        addressesContracted: [],
        addressesContractedWithin: []
      }

    const emptyErrorsBeforeValidationObject = {
      email: undefined,
      username: undefined,
      password: undefined,
      passwordRepeat: undefined,
      agb: undefined,
      addressSimple: {
        street: undefined,
        streetNumber: undefined,
        plz: undefined,
        city: undefined
      },
      names: undefined,
      address: undefined,
      addressesContracted: undefined,
      addressesContractedWithin: undefined
    }

    const emptyErrorsAfterValidationObject =
      {
        email: { messages: ["not present", 'must be a valid E-Mail'] },
        username: { messages: ["not present", 'must have at least 8 characters'] },
        password: { messages: ["not present", 'must have at least 8 characters'] },
        passwordRepeat: { messages: ["not present"] },
        agb: { messages: ['errors:mustBeAccepted'] },
        addressSimple: {
          street: { messages: ["not present"] },
          streetNumber: { messages: ["not present", "null is not a valid Number"] },
          plz: { messages: ["not present"] },
          city: { messages: ["not present"] }
        },
        names: { messages: ['must have at least 3 elements', "not present"] },
        address: {
          street: { messages: ["not present"] },
          streetNumber: { messages: ["null is not a valid Number", "not present"] },
          plz: { messages: ["not present"] },
          city: { messages: ["not present"] },
          messages: []
        },
        addressesContracted: { messages: ['must have at least 3 elements'] },
        addressesContractedWithin: { messages: ['must have at least 3 elements'] }
      }

    expect(signUpContract.toObject()).toStrictEqual(emptyObject)
    expect(signUpContract.errors).toStrictEqual(emptyErrorsBeforeValidationObject)
    expect(signUpContract.isValid()).toBe(false)
    expect(signUpContract.errors).toStrictEqual(emptyErrorsAfterValidationObject)

  })

  it("validates complex contract", () => {
    const signUpContract = new SignupContract()

    const validInputObject =
      {
        email: 'some@email.com',
        username: 'ikarusAD',
        password: 'topsecret',
        passwordRepeat: 'topsecret',
        agb: true,
        addressSimple: { street: 'some', streetNumber: 123, plz: "01234", city: 'Köln' },
        names: ["Max", "Laura", "Fedja"],
        address: { street: 'Markusstr.', streetNumber: 36, plz: "09130", city: 'Chemnitz' },
        addressesContracted: [
          { street: 'Uhlandstr.', streetNumber: 361, plz: "09130", city: 'Flöha' },
          { street: 'Gießerstr.', streetNumber: 11, plz: "09130", city: 'Berlin' },
          { street: 'Humboldplatz.', streetNumber: 1, plz: "01099", city: 'Leipzig' }
        ],
        addressesContractedWithin: [
          { street: 'Uhland2str.', streetNumber: 3612, plz: "09132", city: 'Flöha2' },
          { street: 'Gießer2str.', streetNumber: 112, plz: "09132", city: 'Berlin2' },
          { street: 'Humbold2platz.', streetNumber: 12, plz: "01092", city: 'Leipzig2' }
        ]
      }

    const invalidInputObject = {
      email: 'someemail.com',
      username: 'ikarus',
      password: 'top',
      passwordRepeat: 'toptop',
      agb: false,
      addressSimple: { street: '', streetNumber: 123, plz: "01234", city: 'Dresden' },
      names: ["Max", ""],
      address: { street: '', streetNumber: 36, plz: "09130", city: 'Chemnitz' },
      addressesContracted: [
        { street: 'Uhlandstr.', streetNumber: "361", plz: "09130", city: '' },
        { street: '', streetNumber: 11, plz: "09130", city: 'Berlin' }
      ],
      addressesContractedWithin: [
        { street: 'Uhland2str.', streetNumber: "3612", plz: "09132", city: '' },
        { street: '', streetNumber: 112, plz: "09132", city: 'Berlin2' }
      ]
    }

    const errorsObject = {
      email: { messages: ['must be a valid E-Mail'] },
      username: { messages: ['must have at least 8 characters'] },
      password: { messages: ['must have at least 8 characters'] },
      passwordRepeat: { messages: ['errors:passwordsNotMatching'] },
      agb: { messages: ['errors:mustBeAccepted'] },
      addressSimple: {
        street: { messages: ["not present"] },
        streetNumber: { messages: [] },
        plz: { messages: [] },
        city: { messages: [] }
      },
      names: {
        '0': { messages: [] },
        '1': { messages: ["not present", "must have at least 3 characters"] },
        messages: ['must have at least 3 elements']
      },
      address: {
        street: { messages: ["not present"] },
        streetNumber: { messages: [] },
        plz: { messages: [] },
        city: { messages: [] },
        messages: []
      },
      addressesContracted: {
        '0': {
          street: { messages: [] },
          streetNumber: { messages: ["361 is not a valid Number", "not present"] },
          plz: { messages: [] },
          city: { messages: ["not present"] }
        },
        '1': {
          street: { messages: ["not present"] },
          streetNumber: { messages: [] },
          plz: { messages: [] },
          city: { messages: [] }
        },
        messages: ['must have at least 3 elements']
      },
      addressesContractedWithin: {
        '0': {
          street: { messages: [] },
          streetNumber: { messages: ["not present", "3612 is not a valid Number"] },
          plz: { messages: [] },
          city: { messages: ["not present"] }
        },
        '1': {
          street: { messages: ["not present"] },
          streetNumber: { messages: [] },
          plz: { messages: [] },
          city: { messages: [] }
        },
        messages: ['must have at least 3 elements']
      }
    }

    const validErrorsObject = {
      email: { messages: [] },
      username: { messages: [] },
      password: { messages: [] },
      passwordRepeat: { messages: [] },
      agb: { messages: [] },
      addressSimple: {
        street: { messages: [] },
        streetNumber: { messages: [] },
        plz: { messages: [] },
        city: { messages: [] }
      },
      names: {
        '0': { messages: [] },
        '1': { messages: [] },
        '2': { messages: [] },
        messages: []
      },
      address: {
        street: { messages: [] },
        streetNumber: { messages: [] },
        plz: { messages: [] },
        city: { messages: [] },
        messages: []
      },
      addressesContracted: {
        '0': {
          street: { messages: [] },
          streetNumber: { messages: [] },
          plz: { messages: [] },
          city: { messages: [] }
        },
        '1': {
          street: { messages: [] },
          streetNumber: { messages: [] },
          plz: { messages: [] },
          city: { messages: [] }
        },
        '2': {
          street: { messages: [] },
          streetNumber: { messages: [] },
          plz: { messages: [] },
          city: { messages: [] }
        },
        messages: []
      },
      addressesContractedWithin: {
        '0': {
          street: { messages: [] },
          streetNumber: { messages: [] },
          plz: { messages: [] },
          city: { messages: [] }
        },
        '1': {
          street: { messages: [] },
          streetNumber: { messages: [] },
          plz: { messages: [] },
          city: { messages: [] }
        },
        '2': {
          street: { messages: [] },
          streetNumber: { messages: [] },
          plz: { messages: [] },
          city: { messages: [] }
        },
        messages: []
      }
    }

    signUpContract.assign(invalidInputObject)
    expect(signUpContract.toObject()).toStrictEqual(invalidInputObject)
    expect(signUpContract.isValid()).toBe(false)
    expect(signUpContract.errors).toStrictEqual(errorsObject)
    expect(signUpContract.toObject()).toStrictEqual(invalidInputObject)

    signUpContract.assign(validInputObject)
    expect(signUpContract.isValid()).toBe(true)
    expect(signUpContract.errors).toStrictEqual(validErrorsObject)
    expect(signUpContract.toObject()).toStrictEqual(validInputObject)

  })
})



describe("arrays", () => {
  class ArrayedContract extends ContractBase {
    defineSchema() {
      return (
        {
          ...super.defineSchema(),
          ...{
            numbers: { dType: "Array", arrayOf: "Number" },
            strings: { dType: "Array", arrayOf: "String" },
            objects: {
              dType: "Array",
              arrayOf: {
                number: { dType: "Number" },
                string: { dType: "String" }
              }
            }
          }
        }
      )
    }

  }

  it('can add new elements to contract with array', () => {
    const arrayedContract = new ArrayedContract()

    expect(arrayedContract.toObject()).toStrictEqual({ numbers: [], strings: [], objects: [] })

    arrayedContract.numbers = [1, 2, 3]
    arrayedContract.strings = ["1", "2", "3"]
    arrayedContract.objects = [{ number: 1, string: "2" }, { number: 2, string: "3" }]

    let validObject = {
      numbers: [ 1, 2, 3 ],
      strings: [ '1', '2', '3' ],
      objects: [ { number: 1, string: '2' }, { number: 2, string: '3' } ]
    }

    expect(arrayedContract.toObject()).toStrictEqual(validObject)
    expect(arrayedContract.toObject()).toStrictEqual(validObject) // check it twice!

    arrayedContract.numbers.push(5)
    arrayedContract.strings.push("6")
    arrayedContract.objects.push({ number: 4, string: "4" })

    validObject = {
      numbers: [ 1, 2, 3, 5 ],
      strings: [ '1', '2', '3', '6' ],
      objects: [ { number: 1, string: '2' }, { number: 2, string: '3' }, { number: 4, string: "4" } ]
    }

    expect(arrayedContract.toObject()).toStrictEqual(validObject)
    expect(arrayedContract.toObject()).toStrictEqual(validObject) // check it twice!

    expect(arrayedContract.isValid()).toBe(true)
    expect(arrayedContract.errors).toStrictEqual(
      {
        "numbers": {
          "messages": []
        },
        "objects": {
          "0": {
            "number": {
              "messages": []
            },
            "string": {
              "messages": []
            }
          },
          "1": {
            "number": {
              "messages": []
            },
            "string": {
              "messages": []
            }
          },
          "2": {
            "number": {
              "messages": []
            },
            "string": {
              "messages": []
            }
          },
          "messages": []
        },
        "strings": {
          "messages": []
        }
      }
    )
  })
})


describe("match", () => {
  class RegexContract extends ContractBase {
  defineSchema() {
    return (
      {
        ...super.defineSchema(),
        ...{
          value: { dType: "String", match: /^[a-zA-Z0-9\s]*$/ },
        }
      }
    )
  }
  }

  it('validates with regex', () => {
    const regexContract = new RegexContract()
    regexContract.value = "Test123 4325 dfsfg 423njki423"
    expect(regexContract.isValid()).toBe(true)
    expect(regexContract.errors).toStrictEqual({ value: { messages: [] } })

    regexContract.value = "Test- fswe 325"
    expect(regexContract.isValid()).toBe(false)
    expect(regexContract.errors).toStrictEqual({ value: { messages: ["invalid"] } })
  })
})