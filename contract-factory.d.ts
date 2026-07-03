/**
 * Handwritten declaration for contract-factory.js - the generic signature with
 * schema type inference is not expressible through JSDoc emit, so like types.d.ts
 * this file is the source of truth for its module (see doc/typescript.md#type-inference).
 */

import type Contract from "./index.js"
import type {ContractClass, ContractObject, InferContract, InferErrors, InferObject, ObjectTypeBrand, Options, Schema, ValidateSchema} from "./types.js"

/**
 * The toObject() return type contributed by the base class: nothing for the plain
 * Contract base, the (possibly precise) toObject type of any other base.
 */
type BaseObject<B extends ContractClass> =
  typeof Contract extends B ? {} :
  ContractObject<InstanceType<B>>

/**
 * The instance type of a factory built contract. The precise toObject() signature comes
 * first, so calls resolve against it instead of the base signature. The ObjectTypeBrand
 * lets nested contracts recover the precise object type (see types.d.ts).
 */
type FactoryInstance<S extends Schema, B extends ContractClass> =
  {toObject(): InferObject<S> & BaseObject<B>} &
  {errors: InferErrors<S>} & // intersects with the base ErrorNode: known field keys stay precise, unknown keys are not rejected
  InstanceType<B> &
  InferContract<S> &
  ObjectTypeBrand<InferObject<S> & BaseObject<B>>

/**
 * Creates a contract class from a schema - without the class boilerplate.
 *
 * Instances of the returned class carry typed fields inferred from the schema and
 * a toObject() signature with renderAs/as key remapping. Pass a base class as second
 * argument to inherit its schema, hooks, additional validations and inferred fields.
 *
 * ```ts
 * const SignupContract = contractClass({
 *   email: {dType: "String", presence: true, isEmail: true},
 * })
 * const contract = new SignupContract()
 * contract.email            // string
 * contract.toObject().email // string
 * ```
 */
export function contractClass<S extends Schema, B extends ContractClass = typeof Contract>(
  schema: S & ValidateSchema<S>,
  base?: B
): new (options?: Options) => FactoryInstance<S, B>
