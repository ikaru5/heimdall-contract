import {getErrorMessageFor, getGenericErrorMessage, validate, validateArray, validateProperty} from "./validation-base.js";
import { validationDefinitions as baseValidationDefinitions } from "./validations.js"

/**
 * @typedef Options
 * @property {object} [schema] - set schema through constructor for little inline contracts for example
 * @property {function} [initNested] - passed hook for internal use only; will be called after own init
 * @property {function} [initAll] - passed hook for internal use only; will be called after own initNested
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
   * @param {Options} options
   */
  constructor(options = undefined) {
    // validation logic bound to the contract instance
    this._validate = validate.bind(this)
    this._validateArray = validateArray.bind(this)
    this._validateProperty = validateProperty.bind(this)
    this._getGenericErrorMessage = getGenericErrorMessage.bind(this)
    this._getErrorMessageFor = getErrorMessageFor.bind(this)

    this.contractConfig = {
      i18next: undefined,
      localizationMethod: "Internal",
      _nonValidationConfigs: [
        "default", "errorMessage", "arrayOf", "innerValidate", "contract", "as", "parseAs", "renderAs"
      ]
    }
    this.setConfig()
    this._additionalValidations = this.addAdditionalValidations()
    this._setValidations()

    // it is possible to set the schema in the constructor options -> small inline contracts for example
    if (options?.schema) {
      this.schema = options.schema
    } else {
      this.schema = this.defineSchema()
    }

    this.errors = {}
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
   * Return schema so the constructor can set it.
   * @returns {object}
   */
  defineSchema() {
    return (
      {}
    )
  }

  addAdditionalValidations(validations = { breaker: {}, normal: {} }) {
    return validations
  }

  /**
   * Hook method
   */
  init() {
  }

  setConfig() {
  }

  // -----------------------------------------------------------------------------------------------
  //  Public API
  // -----------------------------------------------------------------------------------------------

  /**
   * Is contract valid?
   * @param context
   * @returns {boolean}
   */
  isValid(context = undefined) {
    this.isValidState = true // if an error occurs it will set it to false during _validate execution.
    this.errors = {}
    this._validationContext = context
    this._validate()
    return this.isValidState
  }

  /**
   * Helper to assign a corresponding Object.
   * @param inputObject
   * @param _depth - private - used for recursion
   * @param _parsedDepth - private - used for recursion
   * @param _currentScope - private - used for recursion
   */
  assign(inputObject, _depth = [], _parsedDepth = [], _currentScope = this.schema) {
    // skip empty assignment
    if ("" === inputObject || undefined === inputObject) {
      this.isAssignedEmpty = true // some validations may need it
      return
    }

    for (const key of Object.keys(_currentScope)) {
      const value = _currentScope[key]
      const inputValueKeys = value.parseAs || value.as || key
      // inputValueKeys can be a string or an array of strings -> if array, try to find a matching key in inputObject
      const inputValue = Array.isArray(inputValueKeys) ?
        this.getFirstMatchingValueAtPath(inputValueKeys.map(key => _parsedDepth.concat(key)), inputObject) :
        this.getValueAtPath(_parsedDepth.concat(inputValueKeys), inputObject)

      if (undefined === inputValue) continue

      if (undefined !== value.dType) {
        switch (value.dType) {
          case "Array":
            for (let index = 0; index < inputValue.length; index++) {
              if (undefined === value.arrayOf) console.error("Type of array must be defined in arrayOf: " + _depth.concat(key).join("."))
              if (undefined === value.arrayOf || "string" === typeof value.arrayOf) {
                this.setValueAtPath(_depth.concat(key).concat(index), inputValue[index] || this._defaultEmptyValueFor(value.arrayOf))
              } else {  // must be a contract, but may fail if nonsense provided
                const nestedContract = this._defaultEmptyValueFor("Contract", value.arrayOf)
                nestedContract._parseParent(this)
                nestedContract.assign(inputValue[index])
                this.setValueAtPath(_depth.concat(key).concat(index), nestedContract)
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
   * @param _depth
   * @param _currentScope
   * @returns {{}}
   */
  toObject(_depth = [], _currentScope = this.schema) {
    const out = {}
    for (const key of Object.keys(_currentScope)) {
      const value = _currentScope[key]
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
              } else {
                // otherwise this is must be nested contract
                if (element.toObject) return element.toObject()
                // if elements were assigned directly no new nested contract was created, do it here!
                const nestedContract = this._defaultEmptyValueFor("Contract", value.arrayOf)
                nestedContract._parseParent(this)
                nestedContract.assign(element)
                return nestedContract.toObject()
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
      const isValidDataType = ["String", "Number", "Boolean", "Generic", "Array", "Contract"].includes(config.dType)
      if (!isValidDataType) console.warn("Wrong dType: " + config.dType + " for: " + depth + ". Assuming Generic dType.")

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
        if ("function" === typeof contract) {
          newContract = new contract({initNested: this.initNested, initAll: this.initAll})
        } else {
          newContract = new Contract({schema: contract, initNested: this.initNested, initAll: this.initAll})
        }
        newContract._parseParent(this)
        return newContract
    }

    return this._defaultEmptyValueFor("Generic")
  }

  /**
   * Method will be run by nested Contracts on creation, assignment and validation.
   * Following tasks are implemented:
   *   * Inherit localizationMethod
   * @param parent Parent contract instance
   * @private
   */
  _parseParent(parent) {
    this.contractConfig.localizationMethod = parent.contractConfig.localizationMethod
    this.contractConfig.i18next = parent.contractConfig.i18next

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
  }

}

export const ContractBase = Contract