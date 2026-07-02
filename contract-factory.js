import Contract from "./index.js"

/**
 * Creates a contract class from a schema - without the class boilerplate.
 *
 * For JavaScript users this is sugar for defining small contracts:
 *   const SignupContract = contractClass({email: {dType: "String", isEmail: true}})
 *
 * For TypeScript users this is the entry to type inference: instances of the returned
 * class carry typed fields derived from the schema (see doc/typescript.md#type-inference).
 *
 * Pass a base class to inherit its schema, hooks and additional validations - the
 * given schema is merged over the schema of the base class:
 *   const EmployeeContract = contractClass({staffId: {dType: "Number"}}, PersonContract)
 *
 * The returned class is a regular contract class: extend it, nest it via dType "Contract"
 * or arrayOf, everything works like with a handwritten class.
 *
 * @param {import('./types.js').Schema} schema - the schema of the contract
 * @param {import('./types.js').ContractClass} [base] - optional contract class to inherit from
 * @returns {import('./types.js').ContractClass} the created contract class
 */
export function contractClass(schema, base = Contract) {
  return class extends base {
    defineSchema() {
      return {...super.defineSchema(), ...schema}
    }
  }
}
