import ContractBase from "../index.js"

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
          email: {dType: "String", presence: true, isEmail: true, allowBlank: false},
          username: {dType: "String", presence: true, min: 8, allowBlank: false},
          password: {dType: "String", presence: true, min: 8, allowBlank: false},
          passwordRepeat: {
            dType: "String", presence: true,
            validate: (value, contract) => {
              return value === contract.password ? true : [false, "errors:passwordsNotMatching"]
            }
          },
          agb: {
            dType: "Boolean", default: false, only: true, errorMessage: "errors:mustBeAccepted",
            validateIf: (value, contract) => {
              return contract.allowBlank
            }
          },
          addressSimple: {
            street: {dType: "String", presence: true },
            streetNumber: {presence: true, dType: "Number" },
            plz: {presence: true, dType: "String" },
            city: {dType: "String", presence: true },
          },
          names: {
            dType: "Array",
            arrayOf: "String",
            min: 3,
            presence: true,
            innerValidate: {presence: true, min: 3, allowBlank: false},
            allowBlank: false
          },
          address: {dType: "Contract", contract: AddressContract, allowBlank: false},
          addressesContracted: {dType: "Array", min: 3, arrayOf: AddressContract, allowBlank: false},
          addressesContractedWithin: {dType: "Array", min: 3, arrayOf: {
              street: {dType: "String", presence: true },
              streetNumber: {presence: true, dType: "Number" },
              plz: {presence: true, dType: "String" },
              city: {dType: "String", presence: true }
            }
          },
        }
      }
    )
  }

}

test('validate empty complex contract', () => {
  let signUpContract = new SignupContract()

  let emptyHash =
    {
      email: '',
      username: '',
      password: '',
      passwordRepeat: '',
      agb: undefined,
      addressSimple: {street: '', streetNumber: null, plz: '', city: ''},
      names: [],
      address: {street: '', streetNumber: null, plz: '', city: ''},
      addressesContracted: [],
      addressesContractedWithin: []
    }

  let emptyErrorsBeforeValidationHash = {
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

  let emptyErrorsAfterValidationHash =
    {
      email: { messages: [ "not present", 'must be a valid E-Mail' ] },
      username: { messages: [ "not present", 'must have at least 8 characters' ] },
      password: { messages: [ "not present", 'must have at least 8 characters' ] },
      passwordRepeat: { messages: [ "not present" ] },
      agb: { messages: [ 'errors:mustBeAccepted', 'errors:mustBeAccepted' ] },
      addressSimple: {
        street: { messages: ["not present"] },
        streetNumber: { messages: ["not present", "null is not a valid Number"] },
        plz: { messages: ["not present"] },
        city: { messages: ["not present"] }
      },
      names: { messages: [ 'must have at least 3 elements', "not present" ] },
      address: {
        street: { messages: ["not present"] },
        streetNumber: { messages: ["null is not a valid Number", "not present"] },
        plz: { messages: ["not present"] },
        city: { messages: ["not present"] },
        messages: []
      },
      addressesContracted: { messages: [ 'must have at least 3 elements' ] },
      addressesContractedWithin: { messages: [ 'must have at least 3 elements' ] }
    }

  expect(signUpContract.toHash()).toStrictEqual(emptyHash)
  expect(signUpContract.errors).toStrictEqual(emptyErrorsBeforeValidationHash)
  expect(signUpContract.isValid()).toBe(false)
  expect(signUpContract.errors).toStrictEqual(emptyErrorsAfterValidationHash)
})

test('validate complex contract', () => {
  let signUpContract = new SignupContract()

  let validInputHash =
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

  let invalidInputHash ={
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

  let errorsHash = {
    email: { messages: [ 'must be a valid E-Mail' ] },
    username: { messages: [ 'must have at least 8 characters' ] },
    password: { messages: [ 'must have at least 8 characters' ] },
    passwordRepeat: { messages: [ 'errors:passwordsNotMatching' ] },
    agb: { messages: [ 'errors:mustBeAccepted' ] },
    addressSimple: {
      street: { messages: ["not present"] },
      streetNumber: { messages: [] },
      plz: { messages: [] },
      city: { messages: [] }
    },
    names: {
      '0': { messages: [] },
      '1': { messages: ["not present", "must have at least 3 characters"] },
      messages: [ 'must have at least 3 elements' ]
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
      messages: [ 'must have at least 3 elements' ]
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
      messages: [ 'must have at least 3 elements' ]
    }
  }

  let validErrorsHash = {
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

  signUpContract.assign(invalidInputHash)
  expect(signUpContract.toHash()).toStrictEqual(invalidInputHash)
  expect(signUpContract.isValid()).toBe(false)
  expect(signUpContract.errors).toStrictEqual(errorsHash)
  expect(signUpContract.toHash()).toStrictEqual(invalidInputHash)

  signUpContract.assign(validInputHash)
  expect(signUpContract.isValid()).toBe(true)
  expect(signUpContract.errors).toStrictEqual(validErrorsHash)
  expect(signUpContract.toHash()).toStrictEqual(validInputHash)
})