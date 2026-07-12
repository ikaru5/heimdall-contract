import {getErrorMessageFor, getGenericErrorMessage, validate, validateArray, validateProperty} from "./validation-base.js";
import {lintSchemaKeywords, lintSchemaStructure, reportSchemaProblems, SchemaError} from "./schema-lint.js"
import { validationDefinitions as baseValidationDefinitions } from "./validations.js"

export { SchemaError }
export { contractClass } from "./contract-factory.js"

/**
 * The type vocabulary lives handwritten in types.d.ts - see doc/typescript.md
 * @typedef {import('./types.js').Options} Options
 * @typedef {import('./types.js').Schema} Schema
 * @typedef {import('./types.js').PropertyDefinition} PropertyDefinition
 * @typedef {import('./types.js').Dtype} Dtype
 * @typedef {import('./types.js').ContractConfig} ContractConfig
 * @typedef {import('./types.js').AdditionalValidations} AdditionalValidations
 * @typedef {import('./types.js').ErrorNode} ErrorNode
 * @typedef {import('./types.js').FlatError} FlatError
 * @typedef {import('./types.js').ContractClass} ContractClass
 */

/**
 * Provides a class based value holder.
 * Supports nested values.
 * !!!ATTENTION!!! 'dType' not allowed as name for a property !!!
 * dType is required and indicates what datatype is used.
 * dType can be "String", "Number", "Boolean", "Array", "Contract" or "Generic" (Generic means it doesn't matter)
 */
export default class Contract {

  // -----------------------------------------------------------------------------------------------
  //  Constructor and Init
  // -----------------------------------------------------------------------------------------------

  /**
   * Heimdall Contract
   * @param {Options} [options]
   */
  constructor(options = undefined) {
    // validation logic bound to the contract instance
    /** @private @type {(schema?: Schema, depth?: Array<string>) => void} */
    this._validate = validate.bind(this)
    /** @private @type {(depth: Array<string>, propertyConfiguration: PropertyDefinition, key: string) => void} */
    this._validateArray = validateArray.bind(this)
    /** @private @type {(depth: Array<string>, propertyConfiguration: PropertyDefinition) => void} */
    this._validateProperty = validateProperty.bind(this)
    /** @private @type {() => string} */
    this._getGenericErrorMessage = getGenericErrorMessage.bind(this)
    /** @private @type {(propertyValue: *, propertyConfiguration: PropertyDefinition, dType: Dtype, depth: Array<string>, validationScope: "normal" | "breaker", validationName: string) => string} */
    this._getErrorMessageFor = getErrorMessageFor.bind(this)
    /** @private @type {(schema: Schema, depth: Array<string>, problems: Array<string>) => Array<string>} */
    this._lintSchemaStructure = lintSchemaStructure.bind(this)
    /** @private @type {(schema: Schema, depth: Array<string>, problems: Array<string>) => Array<string>} */
    this._lintSchemaKeywords = lintSchemaKeywords.bind(this)
    /** @private @type {(problems: Array<string>) => void} */
    this._reportSchemaProblems = reportSchemaProblems.bind(this)

    /** @type {ContractConfig} */
    this.contractConfig = {
      customLocalization: undefined,
      tryTranslateMessages: true, // If true, will try to use i18n.t on passed messages. Only affects external localization methods.
      ignoreUnderscoredFields: false,
      strictSchema: true, // If true, schema problems throw a SchemaError. If false, they are logged to the console instead.
      _nonValidationConfigs: [
        "default", "errorMessage", "arrayOf", "innerValidate", "contract", "as", "parseAs", "renderAs"
      ]
    }
    this.setConfig()
    if (options && Object.keys(options).includes("ignoreUnderscoredFields"))
      this.contractConfig.ignoreUnderscoredFields = options["ignoreUnderscoredFields"]
    if (options && Object.keys(options).includes("strictSchema"))
      this.contractConfig.strictSchema = options["strictSchema"]

    this._additionalValidations = this.addAdditionalValidations()
    this._setValidations()

    // it is possible to set the schema in the constructor options -> small inline contracts for example
    /** @type {Schema} */
    this.schema = options?.schema ? options.schema : this.defineSchema()

    // structural schema lint - keywords are linted later on isValid, when inherited validations are known
    this._reportSchemaProblems(this._lintSchemaStructure(this.schema, [], []))

    /** @type {ErrorNode} */
    this.errors = {}
    // non-enumerable: observers and the parent backlink must never leak into
    // JSON.stringify/spread output - _parent would make serialization circular
    Object.defineProperty(this, "_mutationSubscribers", { value: [], writable: true })
    Object.defineProperty(this, "_parent", { value: undefined, writable: true })
    this.init()
    if ("function" === typeof options?.initNested) {
      this.initNested = options.initNested.bind(this)
      this.initNested()
    }
    if ("function" === typeof options?.initAll) this.initAll = options.initAll.bind(this)
    if ("function" === typeof this.initAll) this.initAll()
    this._define(this.schema, [])

    this.isValidState = undefined
    this.isAssignedEmpty = false
  }

  /**
   * Subscribe to mutations made through the contract's EXPLICIT API:
   * setValueAtPath (which assign runs through), assign's array handling,
   * validation runs (path "errors") and changes bubbling up from nested
   * contracts. Deliberately NOT covered: raw property writes and raw array
   * mutations (contract.name = x, contract.items.push(...)) - contracts stay
   * plain validation-focused value holders without instrumentation; reactive
   * editing belongs to an adapter's store API (e.g. heimdall-react-state's
   * setValue).
   * @param {function({path: string}): void} callback
   * @returns {function} unsubscribe
   */
  subscribeMutations(callback) {
    this._mutationSubscribers.push(callback)
    return () => {
      this._mutationSubscribers = this._mutationSubscribers.filter(subscriber => subscriber !== callback)
    }
  }

  /**
   * Notify subscribers and bubble to the parent contract (if any).
   * @param {Array<string|number>} depth
   * @private
   */
  _notifyMutation(depth) {
    if (this._mutationSubscribers.length > 0) {
      const event = {path: depth.join(".")}
      for (const subscriber of [...this._mutationSubscribers]) {
        try {
          subscriber(event)
        } catch (error) {
          console.error(`Mutation subscriber threw: ${error}`)
        }
      }
    }

    this._parent?._notifyChildMutation?.(this, depth)
  }

  /**
   * A nested contract mutated: locate it NOW (reorder-safe, never cached) and
   * re-notify with the prefixed path.
   * @private
   */
  _notifyChildMutation(child, childDepth) {
    const prefix = this._locateChild(child, this.schema, [])
    if (prefix) this._notifyMutation(prefix.concat(childDepth))
  }

  /**
   * Finds the current path of a nested contract instance by walking the
   * schema - dynamic on purpose, so array reordering can never leave stale
   * paths behind.
   * @private
   */
  _locateChild(child, schema, depth) {
    for (const key of Object.keys(schema)) {
      const config = schema[key]
      if (this.contractConfig.ignoreUnderscoredFields && key.startsWith("_")) continue
      if (null === config || "object" !== typeof config) continue

      if (undefined === config.dType) {
        const found = this._locateChild(child, config, depth.concat(key))
        if (found) return found
        continue
      }
      if ("Contract" === config.dType && this.getValueAtPath(depth.concat(key)) === child) {
        return depth.concat(key)
      }
      if ("Array" === config.dType) {
        const elements = this.getValueAtPath(depth.concat(key))
        const index = Array.isArray(elements) ? elements.indexOf(child) : -1
        if (index >= 0) return depth.concat(key, String(index))
      }
    }
    return null
  }

  /**
   * Return schema so the constructor can set it.
   * Override this method to define the fields of your contract - see doc/schema.md
   * @returns {Schema}
   */
  defineSchema() {
    return (
      {}
    )
  }

  /**
   * Hook method to add custom validations to the contract.
   * Override this method to add custom validation rules - see doc/validation/additionalValidations.md
   * @param {AdditionalValidations} [validations] - Custom validations grouped into breaker and normal
   * @returns {AdditionalValidations} The validations object with custom validation definitions
   */
  addAdditionalValidations(validations = { breaker: {}, normal: {} }) {
    return validations
  }

  /**
   * Hook method
   */
  init() {
  }

  /**
   * Hook method to set custom configuration for the contract.
   * Override this method to customize contract behavior and settings.
   */
  setConfig() {
  }

  // -----------------------------------------------------------------------------------------------
  //  Public API
  // -----------------------------------------------------------------------------------------------

  /**
   * Is contract valid?
   * @param {string | Array<string>} [context] - validation context(s), see doc/validation/on.md
   * @returns {boolean}
   * @throws {SchemaError} if the schema uses unknown validation keywords and strictSchema is enabled
   */
  isValid(context = undefined) {
    // keyword lint happens here and not at construction time, because additional
    // validations may be inherited from a parent contract through _parseParent
    if (!this._keywordLintChecked) {
      this._reportSchemaProblems(this._lintSchemaKeywords(this.schema, [], []))
      this._keywordLintChecked = true // set after reporting, so strict mode keeps throwing on every isValid call
    }

    this.isValidState = true // if an error occurs it will set it to false during _validate execution.
    this.errors = {}
    this._validationContext = context
    this._validate()
    this._notifyMutation(["errors"])
    return this.isValidState
  }

  /**
   * Returns the error node at a field path - the form friendly way to read errors.
   * Array elements are addressed by their index: "items.0.name" or ["items", 0, "name"].
   * @param {string | Array<string|number>} path
   * @returns {ErrorNode | undefined} the node, or undefined if there are no errors at the path
   */
  errorsAt(path) {
    const segments = Array.isArray(path) ? path : path.split(".")
    let node = this.errors
    for (const segment of segments) {
      // a node has either erroneous fields or erroneous elements, never both
      node = node.fields?.[segment] ?? node.elements?.[segment]
      if (undefined === node) return undefined
    }
    return node
  }

  /**
   * Returns all errors as a flat list - handy for toasts, logging or summaries.
   * @param {ErrorNode} [_node] - private - used for recursion
   * @param {Array<string|number>} [_path] - private - used for recursion
   * @param {Array<FlatError>} [_out] - private - used for recursion
   * @returns {Array<FlatError>} entries with path (array indices as numbers), validation and message
   */
  flatErrors(_node = this.errors, _path = [], _out = []) {
    if (undefined !== _node.issues) {
      for (const issue of _node.issues) _out.push({path: [..._path], validation: issue.validation, message: issue.message}) // copy the path, so entries never share array instances
    }
    if (undefined !== _node.fields) {
      for (const key of Object.keys(_node.fields)) this.flatErrors(_node.fields[key], _path.concat(key), _out)
    }
    if (undefined !== _node.elements) {
      for (const key of Object.keys(_node.elements)) this.flatErrors(_node.elements[key], _path.concat(Number(key)), _out)
    }
    return _out
  }

  /**
   * Helper to assign a corresponding Object.
   * @param {*} inputObject - nested data, e.g. from your API or state management
   * @param {Array<string>} [_depth] - private - used for recursion
   * @param {Array<string>} [_parsedDepth] - private - used for recursion
   * @param {Schema} [_currentScope] - private - used for recursion
   */
  assign(inputObject, _depth = [], _parsedDepth = [], _currentScope = this.schema) {
    // skip empty assignment
    if ("" === inputObject || undefined === inputObject || null === inputObject) {
      this.isAssignedEmpty = true // some validations may need it
      return
    }

    for (const key of Object.keys(_currentScope)) {
      if (this.contractConfig.ignoreUnderscoredFields && key.startsWith("_")) continue // ignore underscored fields

      const value = _currentScope[key]
      if (null === value || "object" !== typeof value) continue // structurally broken node, reported by the schema lint

      const inputValueKeys = value.parseAs || value.as || key
      // inputValueKeys can be a string or an array of strings -> if array, try to find a matching key in inputObject
      const inputValue = Array.isArray(inputValueKeys) ?
        this.getFirstMatchingValueAtPath(inputValueKeys.map(key => _parsedDepth.concat(key)), inputObject) :
        this.getValueAtPath(_parsedDepth.concat(inputValueKeys), inputObject)

      if (undefined === inputValue) continue

      if (undefined !== value.dType) {
        switch (value.dType) {
          case "Array":
            // assign replaces the array as a whole - without truncation,
            // re-assigning a shorter array left stale trailing elements
            // behind ([1, 2] assigned with [3] became [3, 2])
            const existingElements = this.getValueAtPath(_depth.concat(key))
            if (Array.isArray(inputValue) && Array.isArray(existingElements) && existingElements.length > inputValue.length) {
              existingElements.length = inputValue.length
              this._notifyMutation(_depth.concat(key))
            }
            for (let index = 0; index < inputValue.length; index++) {
              // a missing arrayOf is reported by the schema lint, elements are assigned as they are
              if (undefined === value.arrayOf || "string" === typeof value.arrayOf) {
                this.setValueAtPath(_depth.concat(key).concat(index), inputValue[index] ?? this._defaultEmptyValueFor(value.arrayOf))
              } else if (Array.isArray(value.arrayOf)) {
                // Array of multiple types
                const isBasicDataType = !value.arrayOf.some(type => !["String", "Number", "Boolean", "Generic"].includes(type))
                if (isBasicDataType) {
                  // simply assign the values if they are basic types
                  this.setValueAtPath(_depth.concat(key).concat(index), inputValue[index] ?? this._defaultEmptyValueFor(value.arrayOf))
                } else {
                  // otherwise this is must be Contracts
                  if (null === inputValue[index] || "object" !== typeof inputValue[index]) console.error("Array of objects must be an array of objects! Property: " + _depth.concat(key).join(".") + " Index: " + index)
                  const requiredContractClass = value.arrayOf.find(contractClass => this._matchesArrayElementType(contractClass, inputValue[index]?.["arrayElementType"]))
                  this.setValueAtPath(_depth.concat(key).concat(index), this._createNestedContractForArray(requiredContractClass, inputValue[index]))
                }
              } else {  // must be a contract, but may fail if nonsense provided
                this.setValueAtPath(_depth.concat(key).concat(index), this._createNestedContractForArray(value.arrayOf, inputValue[index]))
              }
            }
            break
          case "Contract":
            let nestedContract = this.getValueAtPath(_depth.concat(key))
            nestedContract.assign(inputValue)
            nestedContract._parseParent(this)
            break
          default:
            this.setValueAtPath(_depth.concat(key), inputValue)
        }
      } else {
        this.assign(inputObject, _depth.concat(key), _parsedDepth.concat(key), value)
      }
    }
  }

  // :'D This is embarrassing, I used StackOverflow to build setValueAtPath and getValueAtPath.
  // So build thanks to https://stackoverflow.com/a/43849204
  /**
   * Helper to assign nested value.
   * @param depth - nesting Array
   * @param value - Value to assign
   * @param object - default: this - object to assign nested value
   */
  setValueAtPath(depth, value, object = this) {
    depth.reduce((o, p, i) => o[p] = depth.length === ++i ? value : o[p] || {}, object)
    // the explicit mutation API is the observable seam - but internal error
    // bookkeeping notifies once per validation run (see isValid), not per write
    if (object === this && "errors" !== depth[0]) this._notifyMutation(depth)
  }

  /**
   * Helper to gather nested value
   * @param depth
   * @param object
   * @returns {*}
   */
  getValueAtPath(depth, object = this) {
    return depth.reduce((o, p) => o[p], object)
  }

  /**
   * Helper to gather nested value from multiple paths. First found will be returned.
   * @param {Array<String>} depths
   * @param {Contract} object
   * @returns {undefined|*}
   */
  getFirstMatchingValueAtPath(depths, object = this) {
    for (const inputValueKey of depths) {
      const value = this.getValueAtPath(inputValueKey, object)
      if (undefined !== value) return value
    }
    return undefined
  }

  /**
   * Returns clean Object with filled data for sending, according to contract schema.
   * Not safe if not validated before!
   * @param {Array<string>} [_depth] - private - used for recursion
   * @param {Schema} [_currentScope] - private - used for recursion
   * @returns {Record<string, unknown>}
   */
  toObject(_depth = [], _currentScope = this.schema) {
    const out = {}
    for (const key of Object.keys(_currentScope)) {
      if (this.contractConfig.ignoreUnderscoredFields && key.startsWith("_")) continue // ignore underscored fields

      const value = _currentScope[key]
      if (null === value || "object" !== typeof value) continue // structurally broken node, reported by the schema lint

      const renderKeys = value.renderAs || value.as || key // for parsing "as" can be an array of keys, but for rendering it must be a single key -> take the first one
      const renderKey = Array.isArray(renderKeys) ? renderKeys[0] : renderKeys

      if (undefined !== value.dType) {
        switch (value.dType) {
          case "Array":
            const valueAtPath = this.getValueAtPath(_depth.concat(key))
            out[renderKey] = valueAtPath?.map((element) => {
              if (undefined === value.arrayOf || "string" === typeof value.arrayOf) {
                // if Array consists of basic types, we can simply return the value
                return element
              } else if (Array.isArray(value.arrayOf)) {
                const isBasicDataType = !value.arrayOf.some(type => !["String", "Number", "Boolean", "Generic"].includes(type))
                if (isBasicDataType) {
                  // simply return the values if they are basic types
                  return element
                } else {
                  // otherwise this is must be nested contract
                  if (element.toObject) return element.toObject()
                  // if elements were assigned directly no new nested contract was created, do it here!
                  const requiredContractClass = value.arrayOf.find(contractClass => this._matchesArrayElementType(contractClass, element["arrayElementType"]))
                  return this._createNestedContractForArray(requiredContractClass, element).toObject()
                }
              } else {
                // otherwise this is must be nested contract
                if (element.toObject) return element.toObject()
                // if elements were assigned directly no new nested contract was created, do it here!
                return this._createNestedContractForArray(value.arrayOf, element).toObject()
              }
            })
            break
          case "Contract":
            out[renderKey] = this.getValueAtPath(_depth.concat(key)).toObject()
            break
          default:
            out[renderKey] = this.getValueAtPath(_depth.concat(key))
        }
      } else {
        out[renderKey] = this.toObject(_depth.concat(key), value)
      }
    }
    return out
  }


  // -----------------------------------------------------------------------------------------------
  //  Private Methods
  // -----------------------------------------------------------------------------------------------

  /**
   * Returns name of a class.
   * @param className
   * @private
   */
  _getNameOfClass(className) {
    return typeof className === 'function' ? className.name : className
  }

  /**
   * Checks whether a contract class is the one an array element's arrayElementType refers to.
   * Prefers the class's static typeName (an explicit serialization identity, stable across
   * minification) and falls back to the class name for backwards compatibility.
   * @param {Function} contractClass - Contract class constructor
   * @param {string} typeName - The element's arrayElementType value
   * @returns {boolean}
   * @private
   */
  _matchesArrayElementType(contractClass, typeName) {
    if (typeof contractClass !== 'function') return false
    return (!!contractClass.typeName && contractClass.typeName === typeName) || contractClass.name === typeName
  }

  /**
   * Creates a nested contract instance for array elements.
   * @param {Function|Object} contractClassOrDefinition - Contract class constructor or schema definition
   * @param {Object} input - Input data to assign to the nested contract
   * @returns {Contract} The created and configured nested contract instance
   * @private
   */
  _createNestedContractForArray(contractClassOrDefinition, input) {
    const nestedContract = this._defaultEmptyValueFor("Contract", contractClassOrDefinition)
    nestedContract._parseParent(this)
    nestedContract.assign(input)
    return nestedContract
  }

  // DEFINITION AND INIT

  /**
   * Associates recursively the values to "this" by passing it to _defineProperty. (this.user.address.street = "")
   * Also prepares this.errors.
   * @param {Object} schema - the current schema level
   * @param {Array<string>} depth - the current depth path of schema (["user", "address", "street"])
   * @private
   */
  _define(schema, depth) {
    for (const key of Object.keys(schema)) {
      const value = schema[key]
      if (this.contractConfig.ignoreUnderscoredFields && key.startsWith("_")) continue // ignore underscored fields
      if (null === value || "object" !== typeof value) continue // structurally broken node, reported by the schema lint

      if (undefined !== value["dType"]) {
        this._defineProperty(depth.concat(key), value)
      } else {
        this._define(value, depth.concat(key))
      }
    }
  }

  /**
   * Associates the value to "this" and prepares this.errors. (this.user.address.street = "")
   * @param {Array<string>} depth
   * @param {Object} config - prop config from schema
   * @private
   */
  _defineProperty(depth, config) {
    if ("Contract" === config.dType) {
      this.setValueAtPath(depth, this._defaultEmptyValueFor(config.dType, config.contract))
    } else {
      // an invalid dType is reported by the schema lint, _defaultEmptyValueFor falls back to Generic
      const targetValue = undefined === config["default"] ?
        this._defaultEmptyValueFor(config.dType) :
        config["default"]

      this.setValueAtPath(depth, targetValue)
    }
  }

  /**
   * Returns a default empty value for a dType. Provide Contract-Class or schema-definition for nested empty contract!
   * @param dType
   * @param contract contract Class or definition for empty contract
   * @returns {*[]|string|*|null|[]|string|undefined}
   * @private
   */
  _defaultEmptyValueFor(dType, contract = undefined) {
    switch (dType) {
      case "String":
        return ""
      case "Number":
        return null
      case "Boolean":
        return undefined
      case "Generic":
        return null
      case "Array":
        return []
      case "Contract":
        let newContract = undefined
        // strictSchema is passed down, so nested contracts of a lenient parent do not throw during their construction
        if ("function" === typeof contract) {
          newContract = new contract({initNested: this.initNested, initAll: this.initAll, strictSchema: this.contractConfig.strictSchema})
        } else {
          newContract = new Contract({schema: contract, initNested: this.initNested, initAll: this.initAll, strictSchema: this.contractConfig.strictSchema})
        }
        newContract._parseParent(this)
        return newContract
    }

    return this._defaultEmptyValueFor("Generic")
  }

  /**
   * Method will be run by nested Contracts on creation, assignment and validation.
   * Following tasks are implemented:
   *   * Inherit customLocalization and tryTranslateMessages
   * @param parent Parent contract instance
   * @private
   */
  _parseParent(parent) {
    this._parent = parent // mutation notifications bubble up this chain
    this.contractConfig.customLocalization = parent.contractConfig.customLocalization
    this.contractConfig.tryTranslateMessages = parent.contractConfig.tryTranslateMessages
    this.contractConfig.ignoreUnderscoredFields = parent.contractConfig.ignoreUnderscoredFields
    this.contractConfig.strictSchema = parent.contractConfig.strictSchema

    // merge additionalValidations
    const myBreaker = this._additionalValidations?.breaker
    const myNormal = this._additionalValidations?.normal

    const parentBreaker = parent._additionalValidations?.breaker
    const parentNormal = parent._additionalValidations?.normal

    this._additionalValidations = {
      normal: {...parentNormal, ...myNormal},
      breaker: {...parentBreaker, ...myBreaker}
    }
    this._setValidations()
  }

  /**
   * Set validations by merging additionalValidations with base validations.
   * @private
   */
  _setValidations() {
    // merge additionalValidations with base validations
    const myBreaker = this._additionalValidations?.breaker
    const myNormal = this._additionalValidations?.normal

    const baseBreaker = baseValidationDefinitions.breaker
    const baseNormal = baseValidationDefinitions.normal

    this._validations = {
      normal: {...baseNormal, ...myNormal},
      breaker: {...baseBreaker, ...myBreaker}
    }

    this._keywordLintChecked = false // available validations changed, keywords need to be linted again on next isValid
  }

}

export const ContractBase = Contract