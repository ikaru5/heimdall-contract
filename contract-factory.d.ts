/**
 * Handwritten declaration for contract-factory.js - the generic signature with
 * schema type inference is not expressible through JSDoc emit, so like types.d.ts
 * this file is the source of truth for its module (see doc/typescript.md#type-inference).
 */

import type Contract from "./index.js"
import type {ContractClass, InferContract, Options, Schema, ValidateSchema} from "./types.js"

/**
 * Creates a contract class from a schema - without the class boilerplate.
 *
 * Instances of the returned class carry typed fields inferred from the schema.
 * Pass a base class as second argument to inherit its schema, hooks, additional
 * validations and inferred fields.
 *
 * ```ts
 * const SignupContract = contractClass({
 *   email: {dType: "String", presence: true, isEmail: true},
 * })
 * const contract = new SignupContract()
 * contract.email // string
 * ```
 */
export function contractClass<S extends Schema, B extends ContractClass = typeof Contract>(
  schema: S & ValidateSchema<S>,
  base?: B
): new (options?: Options) => InstanceType<B> & InferContract<S>
