/**
 * Handwritten type vocabulary of Heimdall Contract.
 *
 * This file is the single source of truth for the schema types. The rest of the public API
 * is documented via JSDoc in the .js files, from which the other .d.ts files are generated
 * (npm run build:types).
 *
 * The interfaces are intentionally interfaces and not type aliases, so they can be extended
 * through declaration merging - for example when custom validations are registered via
 * addAdditionalValidations:
 *
 * ```ts
 * declare module "@ikaru5/heimdall-contract/types" {
 *   interface PropertyDefinition {
 *     mustBeOliver?: boolean
 *   }
 * }
 * ```
 */

import type Contract from "./index.js"

/** Basic data types - usable as arrayOf entries. */
export type BasicDtype = "String" | "Number" | "Boolean" | "Generic"

/** All data types a field definition can declare. */
export type Dtype = BasicDtype | "Array" | "Contract"

/** A contract class (not an instance), e.g. for dType "Contract" or arrayOf. */
export type ContractClass = new (options?: Options) => Contract

/**
 * A contract instance including its dynamic schema fields.
 * The fields defined by the schema only exist at runtime, so they are typed as any -
 * declare them on your subclass for full typing (see doc/typescript.md).
 */
export type AnyContract = Contract & Record<string, any>

/**
 * Most validation configs accept a static value or a function that is evaluated at validation time
 * with the current value and contract.
 */
export type DynamicConfig<T> = T | ((value: any, contract: AnyContract, dType: Dtype, depth: Array<string>) => T)

/**
 * The arrayOf config of an Array field: a basic dType, an array of basic dTypes (mixed basic types),
 * a contract class, an inline schema or an array of contract classes/inline schemas (mixed contracts).
 */
export type ArrayOf = BasicDtype | Array<BasicDtype> | ContractClass | Schema | Array<ContractClass | Schema>

/** A custom error message function - see doc/localization.md. */
export type ErrorMessageFn = (value: any, contract: AnyContract, validationName: string, dType: Dtype, depth: Array<string>, validationScope: "normal" | "breaker") => string

/**
 * The errorMessage config of a field: one message for everything, or a map from
 * validation name to message with an optional default.
 */
export type ErrorMessage = string | ErrorMessageFn | ({ default?: string | ErrorMessageFn } & Record<string, string | ErrorMessageFn | undefined>)

/**
 * A single field definition within a schema.
 *
 * Keywords starting with an underscore (like "_label") are allowed as meta keywords for
 * external tooling - enable ignoreUnderscoredFields so they are skipped at runtime too.
 * Custom validations registered via addAdditionalValidations can be added to this interface
 * through declaration merging (see file header).
 */
export interface PropertyDefinition {
  /** Data type of the field. Required - it also marks an object as a field definition. */
  dType: Dtype

  // breakers - see doc/validation.md#validation-breakers
  /** Skip all validations if the value is blank - see doc/validation/allowBlank.md */
  allowBlank?: DynamicConfig<boolean>
  /** Validate only if the given validation context is active - see doc/validation/on.md */
  on?: string | Array<string>
  /** Validate only if this function returns true - see doc/validation/validateIf.md */
  validateIf?: (value: any, contract: AnyContract, dType: Dtype, depth: Array<string>) => boolean

  // normal validations - see doc/validation.md#normal-validations
  /** Field must be present - see doc/validation/presence.md */
  presence?: DynamicConfig<boolean>
  /** Field must be absent - see doc/validation/absence.md */
  absence?: DynamicConfig<boolean>
  /** Field must (or must not) be a valid email address - see doc/validation/isEmail.md */
  isEmail?: DynamicConfig<boolean>
  /** Field must match the regular expression - see doc/validation/match.md */
  match?: DynamicConfig<RegExp>
  /** Field must equal the value or be included in the values - see doc/validation/only.md */
  only?: DynamicConfig<unknown | Array<unknown>>
  /** Like only, but arrays must match exactly - see doc/validation/strictOnly.md */
  strictOnly?: DynamicConfig<unknown | Array<unknown>>
  /** Minimum length (String/Array) or value (Number) - see doc/validation/min.md */
  min?: DynamicConfig<number>
  /** Maximum length (String/Array) or value (Number) - see doc/validation/max.md */
  max?: DynamicConfig<number>
  /** Custom validation: return true (valid), false (generic message) or a string (custom message) - see doc/validation/validate.md */
  validate?: (value: any, contract: AnyContract, dType: Dtype, depth: Array<string>) => boolean | string

  // non-validation configs
  /** Default value used when nothing is assigned. */
  default?: unknown
  /** Custom error message(s) - see doc/localization.md#custom-error-messages */
  errorMessage?: ErrorMessage
  /** Element type of an Array field - required for dType "Array". */
  arrayOf?: ArrayOf
  /** Validations applied to each array element - see doc/schema.md */
  innerValidate?: Partial<PropertyDefinition>
  /** Contract class or inline schema of a nested contract - required for dType "Contract". */
  contract?: ContractClass | Schema
  /** Key mapping for assign() and toObject() - see doc/schema.md */
  as?: string | Array<string>
  /** Key mapping for assign() only - see doc/schema.md */
  parseAs?: string | Array<string>
  /** Key mapping for toObject() only - see doc/schema.md */
  renderAs?: string | Array<string>

  /** Meta keywords for external tooling, skipped by heimdall when ignoreUnderscoredFields is enabled. */
  [metaKeyword: `_${string}`]: unknown
}

/**
 * A contract schema: field definitions (objects with dType) and nested schema objects, arbitrarily deep.
 */
export interface Schema {
  [field: string]: PropertyDefinition | Schema
}

/**
 * Constructor options of a contract.
 */
export interface Options {
  /** Set the schema through the constructor - for small inline contracts. Otherwise defineSchema() is used. */
  schema?: Schema
  /** Skip fields and validation keywords starting with an underscore - see doc/configuration.md */
  ignoreUnderscoredFields?: boolean
  /** Throw a SchemaError on schema problems (default true) - see doc/schema.md#schema-linting */
  strictSchema?: boolean
  /** Hook called after init of every nested contract - internal use. */
  initNested?: (this: Contract) => void
  /** Hook called after initNested of every contract in the tree - internal use. */
  initAll?: (this: Contract) => void
}

/** Parameters passed to a customLocalization callback - see doc/localization.md */
export interface CustomLocalizationParams {
  /** The primary translation key, e.g. "errors:presence.true". */
  translationKey: string
  /** All translation keys in fallback order. */
  translationKeys: Array<string>
  /** The untranslated default message. */
  fallbackValue: string
  /** Context for interpolation: value, dType, depth, contract and validation specific extras. */
  context: { value?: unknown, dType?: Dtype, depth?: Array<string>, contract: AnyContract, [extra: string]: unknown }
}

/** A localization callback like an i18next wrapper - see doc/localization.md */
export type CustomLocalization = (params: CustomLocalizationParams) => string

/** The contractConfig of a contract instance - see doc/configuration.md */
export interface ContractConfig {
  /** Localization callback used for error messages - see doc/localization.md */
  customLocalization: CustomLocalization | undefined
  /** If true, tries to translate custom error messages through customLocalization. */
  tryTranslateMessages: boolean
  /** Skip fields and validation keywords starting with an underscore. */
  ignoreUnderscoredFields: boolean
  /** Throw a SchemaError on schema problems instead of logging - see doc/schema.md#schema-linting */
  strictSchema: boolean
  /** Internal: schema keywords that are configs, not validations. Do not remove entries. */
  _nonValidationConfigs: Array<string>
}

/** Parameters passed to the check function of a validation definition. */
export interface CheckParams {
  /** The value being validated. */
  value: any
  /** The validation config from the schema, e.g. the number of a min validation. */
  config: any
  /** The data type of the field. */
  dType: Dtype
  /** The field path, e.g. ["address", "street"]. */
  depth: Array<string>
  /** The contract instance. */
  contract: AnyContract
}

/** Parameters passed to the message function of a validation definition. */
export interface MessageParams extends CheckParams {
  /** The localization callback if one is configured. */
  customLocalization?: CustomLocalization
}

/** A single validation definition - see doc/validation/additionalValidations.md */
export interface ValidationDefinition {
  /** Returns true if the value is valid (normal) or if remaining validations should be skipped (breaker). */
  check: (params: CheckParams) => boolean
  /** Returns the error message for a failed check. Not used for breakers. */
  message?: (params: MessageParams) => string
}

/** Custom validations grouped by kind - returned by addAdditionalValidations. */
export interface AdditionalValidations {
  /** Breakers run first, a matching breaker skips the remaining validations of the field. */
  breaker: Record<string, ValidationDefinition>
  /** Normal validations - a failing check marks the field as invalid. */
  normal: Record<string, ValidationDefinition>
}

/** The errors object of a contract after isValid(): messages per field, nested like the schema. */
export interface ValidationErrors {
  messages?: Array<string>
  [field: string]: ValidationErrors | Array<string> | undefined
}

// ---------------------------------------------------------------------------------------
// Type inference - deriving instance field types from a schema (doc/typescript.md#type-inference)
// ---------------------------------------------------------------------------------------

/**
 * Derives the instance field types from a schema.
 *
 * The types mirror the runtime exactly: every field always exists because heimdall
 * initializes it with its default empty value - "" for String, null for Number,
 * undefined for Boolean, [] for Array, a contract instance for Contract.
 *
 * The schema must keep its literal type for this to work: either let it be inferred
 * through contractClass(schema), or preserve it with `satisfies Schema` - an explicit
 * `: Schema` annotation would widen it and erase the field information.
 */
export type InferContract<S extends Schema> = {
  [K in keyof S]: InferField<S[K]>
}

/**
 * Derives the type of a single schema node: a field definition or a nested schema object.
 * A field with a matching default value can never hold its empty value, so the
 * empty type (null for Number, undefined for Boolean) is removed from the union.
 */
type InferField<F> =
  F extends {dType: "String"} ? string :
  F extends {dType: "Number"} ? (F extends {default: number} ? number : number | null) :
  F extends {dType: "Boolean"} ? (F extends {default: boolean} ? boolean : boolean | undefined) :
  F extends {dType: "Generic"} ? any :
  F extends {dType: "Array", arrayOf: infer A} ? Array<InferElement<A>> :
  F extends {dType: "Array"} ? Array<unknown> :
  F extends {dType: "Contract", contract: infer C} ? InferNested<C> :
  F extends Schema ? InferContract<F> :
  never

/** Derives the element type of an arrayOf config. Distributes over mixed type arrays. */
type InferElement<A> =
  A extends "String" ? string :
  A extends "Number" ? number :
  A extends "Boolean" ? boolean :
  A extends "Generic" ? any :
  A extends ContractClass ? InstanceType<A> :
  A extends ReadonlyArray<infer E> ? InferElement<E> :
  A extends Schema ? Contract & InferContract<A> :
  unknown

/** Derives the instance type of a nested contract config: a contract class or an inline schema. */
type InferNested<C> =
  C extends ContractClass ? InstanceType<C> :
  C extends Schema ? Contract & InferContract<C> :
  never

/**
 * Compile time schema linting for inference entry points like contractClass.
 *
 * Generic inference does not apply excess property checks, so a typo like "presense"
 * would silently pass through `S extends Schema`. Intersecting the parameter with
 * this type maps every unknown keyword to never, which turns the typo into a compile
 * error - the type level counterpart of the runtime schema lint.
 * Custom validations added to PropertyDefinition via declaration merging are known keys.
 */
export type ValidateSchema<S> = {
  [K in keyof S]: S[K] extends {dType: any} ? ValidateField<S[K]> : ValidateSchema<S[K]>
}

/**
 * Maps unknown keywords of a field definition to never - see ValidateSchema.
 * The keywords of an innerValidate config are checked recursively, mirroring the
 * runtime keyword lint: arrays of basic types support the full validation set,
 * contract arrays only breakers and validateIf.
 */
type ValidateField<F> = {
  [K in keyof F]:
    K extends "innerValidate" ? ValidateInnerValidate<F[K], F extends {arrayOf: infer A} ? A : undefined> :
    K extends keyof PropertyDefinition ? F[K] :
    never
}

/** Dispatches the innerValidate keyword check by the arrayOf form - see ValidateField. */
type ValidateInnerValidate<I, A> =
  A extends BasicDtype | ReadonlyArray<BasicDtype>
    ? ValidateField<I>
    : ValidateBreakersOnly<I>

/** Contract arrays support only breakers in innerValidate - everything else maps to never. */
type ValidateBreakersOnly<I> = {
  [K in keyof I]:
    K extends "allowBlank" | "on" | "validateIf" ? I[K] :
    K extends `_${string}` ? I[K] :
    never
}
