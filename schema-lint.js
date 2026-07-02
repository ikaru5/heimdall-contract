/**
 * Schema linting for Heimdall Contracts.
 *
 * Linting runs in two phases because they need different knowledge:
 *   - structure  -  checked at construction time: dTypes, arrayOf, contract, node shapes.
 *                   These are self-contained and can fail as early as possible.
 *   - keywords   -  checked at the beginning of isValid(): every key of a property config must be a known
 *                   validation. This can not happen at construction time, because additional validations
 *                   may be inherited from a parent contract through _parseParent, which runs after construction.
 *
 * Note: like in validation-base.js all lint functions are exported and bound to the contract instance.
 * The bound version is private (starts with _). Always use the bound version!
 */

export class SchemaError extends Error {
  /**
   * @param {Array<string>} problems - list of schema problems, each with a path to the offending config
   */
  constructor(problems) {
    super("Invalid contract schema:\n" + problems.map((problem) => `  - ${problem}`).join("\n"))
    this.name = "SchemaError"
    this.problems = problems
  }
}

const VALID_DTYPES = ["String", "Number", "Boolean", "Generic", "Array", "Contract"]
const BASIC_DTYPES = ["String", "Number", "Boolean", "Generic"]

/**
 * Reports collected schema problems according to the strictSchema config:
 * throws a SchemaError in strict mode, logs to the console otherwise.
 * @param {Array<string>} problems
 * @private
 */
export const reportSchemaProblems = function (problems) {
  if (0 === problems.length) return
  if (this.contractConfig.strictSchema) throw new SchemaError(problems)
  console.error(new SchemaError(problems).message)
}

/**
 * Recursively checks the structural integrity of a schema and collects problems.
 * Runs at construction time - see file header for the two lint phases.
 * @param {Object} schema - the current schema level
 * @param {Array<string>} depth - current depth path, used for problem messages
 * @param {Array<string>} problems - basket for all problems
 * @returns {Array<string>} the problems basket
 * @private
 */
export const lintSchemaStructure = function (schema, depth = [], problems = []) {
  for (const key of Object.keys(schema)) {
    if (this.contractConfig.ignoreUnderscoredFields && key.startsWith("_")) continue // ignore underscored fields

    const value = schema[key]
    const path = depth.concat(key).join(".")

    if (null === value || "object" !== typeof value || Array.isArray(value)) {
      problems.push(`"${path}" must be a property config or a nested schema object`)
      continue
    }

    // no dType -> nested schema object, recurse
    if (undefined === value.dType) {
      this._lintSchemaStructure(value, depth.concat(key), problems)
      continue
    }

    if (!VALID_DTYPES.includes(value.dType)) problems.push(`invalid dType "${value.dType}" at "${path}"`)

    if ("Array" === value.dType) {
      lintArrayOf(this, value.arrayOf, path, depth.concat(key), problems)
      if (undefined !== value.innerValidate && (null === value.innerValidate || "object" !== typeof value.innerValidate || Array.isArray(value.innerValidate))) {
        problems.push(`"innerValidate" at "${path}" must be an object`)
      }
    } else {
      if (undefined !== value.arrayOf) problems.push(`"arrayOf" at "${path}" is only supported on dType "Array"`)
      if (undefined !== value.innerValidate) problems.push(`"innerValidate" at "${path}" is only supported on dType "Array"`)
    }

    if ("Contract" === value.dType) {
      if (undefined === value.contract) {
        problems.push(`missing "contract" for dType "Contract" at "${path}"`)
      } else if ("function" !== typeof value.contract && (null === value.contract || "object" !== typeof value.contract)) {
        problems.push(`"contract" at "${path}" must be a contract class or a schema object`)
      } else if ("object" === typeof value.contract) {
        this._lintSchemaStructure(value.contract, depth.concat(key), problems) // inline schema, lint it upfront
      }
    } else if (undefined !== value.contract) {
      problems.push(`"contract" at "${path}" is only supported on dType "Contract"`)
    }

    if (undefined !== value.validate && "function" !== typeof value.validate) problems.push(`"validate" at "${path}" must be a function`)
    if (undefined !== value.validateIf && "function" !== typeof value.validateIf) problems.push(`"validateIf" at "${path}" must be a function`)
  }

  return problems
}

/**
 * Checks the arrayOf configuration of an Array property.
 * Valid forms: a basic dType string, an array of basic dType strings (mixed basic types),
 * a contract class, a schema object (inline contract) or an array of contract classes/schema objects (mixed contracts).
 * @param {Object} instance - the contract instance
 * @param {*} arrayOf - the arrayOf config to check
 * @param {string} path - path for problem messages
 * @param {Array<string>} depth - current depth path for recursion into inline schemas
 * @param {Array<string>} problems - basket for all problems
 * @private
 */
const lintArrayOf = (instance, arrayOf, path, depth, problems) => {
  if (undefined === arrayOf) {
    problems.push(`missing "arrayOf" for dType "Array" at "${path}"`)
    return
  }

  if ("string" === typeof arrayOf) {
    if (!BASIC_DTYPES.includes(arrayOf)) problems.push(`invalid arrayOf "${arrayOf}" at "${path}" - must be one of "${BASIC_DTYPES.join('", "')}", a contract class or a schema object`)
    return
  }

  if (Array.isArray(arrayOf)) {
    if (0 === arrayOf.length) {
      problems.push(`"arrayOf" at "${path}" must not be an empty array`)
      return
    }

    const allBasic = arrayOf.every((entry) => "string" === typeof entry)
    const allContracts = arrayOf.every((entry) => "function" === typeof entry || (null !== entry && "object" === typeof entry))

    if (allBasic) {
      for (const entry of arrayOf) {
        if (!BASIC_DTYPES.includes(entry)) problems.push(`invalid arrayOf entry "${entry}" at "${path}" - must be one of "${BASIC_DTYPES.join('", "')}"`)
      }
    } else if (allContracts) {
      for (const entry of arrayOf) {
        if ("function" !== typeof entry) instance._lintSchemaStructure(entry, depth, problems) // inline schema, lint it upfront
      }
    } else {
      problems.push(`"arrayOf" at "${path}" must contain either only basic dTypes or only contracts`)
    }
    return
  }

  if ("function" === typeof arrayOf) return // contract class

  if (null !== arrayOf && "object" === typeof arrayOf) {
    instance._lintSchemaStructure(arrayOf, depth, problems) // inline schema, lint it upfront
    return
  }

  problems.push(`invalid "arrayOf" at "${path}"`)
}

/**
 * Recursively checks that every keyword of a property config is a known validation and collects problems.
 * Runs at the beginning of isValid() - see file header for the two lint phases.
 * Nested contract instances lint themselves when they are validated.
 * @param {Object} schema - the current schema level
 * @param {Array<string>} depth - current depth path, used for problem messages
 * @param {Array<string>} problems - basket for all problems
 * @returns {Array<string>} the problems basket
 * @private
 */
export const lintSchemaKeywords = function (schema, depth = [], problems = []) {
  for (const key of Object.keys(schema)) {
    if (this.contractConfig.ignoreUnderscoredFields && key.startsWith("_")) continue // ignore underscored fields

    const value = schema[key]
    if (null === value || "object" !== typeof value) continue // structural problem, already reported at construction time

    // no dType -> nested schema object, recurse
    if (undefined === value.dType) {
      this._lintSchemaKeywords(value, depth.concat(key), problems)
      continue
    }

    const path = depth.concat(key).join(".")
    const isContractField = "Contract" === value.dType

    for (const keyword of Object.keys(value)) {
      if (this.contractConfig.ignoreUnderscoredFields && keyword.startsWith("_")) continue // ignore underscored validations
      if ("dType" === keyword || "validateIf" === keyword) continue
      if (this.contractConfig._nonValidationConfigs.includes(keyword)) continue
      if (undefined !== this._validations.breaker[keyword]) continue

      if ("validate" === keyword || undefined !== this._validations.normal[keyword]) {
        // contract fields delegate to the validations of the nested contract, only breakers are supported on the field itself
        if (isContractField) problems.push(`validation "${keyword}" at "${path}" is not supported on Contract fields, define it inside the nested contract instead`)
        continue
      }

      problems.push(`unknown validation "${keyword}" at "${path}"`)
    }

    if ("Array" === value.dType && null !== value.innerValidate && "object" === typeof value.innerValidate && !Array.isArray(value.innerValidate)) {
      lintInnerValidateKeywords(this, value, `${path}.innerValidate`, problems)
    }
  }

  return problems
}

/**
 * Checks the keywords of an innerValidate configuration.
 * Arrays of basic types support the full validation set, contract arrays only breakers and validateIf.
 * @param {Object} instance - the contract instance
 * @param {Object} propertyConfiguration - the Array property config holding the innerValidate
 * @param {string} path - path for problem messages
 * @param {Array<string>} problems - basket for all problems
 * @private
 */
const lintInnerValidateKeywords = (instance, propertyConfiguration, path, problems) => {
  const arrayOf = propertyConfiguration.arrayOf
  const isBasicArray = "string" === typeof arrayOf || (Array.isArray(arrayOf) && "string" === typeof arrayOf[0])

  for (const keyword of Object.keys(propertyConfiguration.innerValidate)) {
    if (instance.contractConfig.ignoreUnderscoredFields && keyword.startsWith("_")) continue // ignore underscored validations
    if ("validateIf" === keyword) continue
    if (undefined !== instance._validations.breaker[keyword]) continue

    if (isBasicArray) {
      if ("dType" === keyword || "validate" === keyword) continue
      if (instance.contractConfig._nonValidationConfigs.includes(keyword)) continue
      if (undefined !== instance._validations.normal[keyword]) continue
      problems.push(`unknown validation "${keyword}" at "${path}"`)
    } else {
      problems.push(`validation "${keyword}" at "${path}" is not supported on contract arrays, only breakers like "allowBlank", "on" and "validateIf"`)
    }
  }
}
