import { validate, validateArray, validateProperty, getErrorMessageFor, getGenericErrorMessage } from "./validation-base.js";

/**
 * Provides a class based value holder.
 * Supports nested values.
 * !!!ATTENTION!!! 'dType' not allowed as name for a property !!!
 * dType is required and indicates what datatype is used.
 * dType can be "String", "Number", "Boolean", "Array", "Contract" or "Generic" (Generic means it doesnt matter)
 */
export default class Index {

  // -----------------------------------------------------------------------------------------------
  //  Constructor and Init
  // -----------------------------------------------------------------------------------------------

  constructor(options) {
    // outsourced validation logic
    this._validate = validate.bind(this)
    this._validateArray = validateArray.bind(this)
    this._validateProperty = validateProperty.bind(this)
    this._getGenericErrorMessage = getGenericErrorMessage.bind(this)
    this._getErrorMessageFor = getErrorMessageFor.bind(this)

    this.contractConfig = {
      i18next: undefined,
      localizationMethod: "Internal",
      params: {},
      _nonValidationConfigs: [
        "default", "errorMessage", "arrayOf", "innerValidate", "contract", "as", "parseAs", "renderAs"
      ]
    }
    this.setConfig()
    if (options?.schema) {
      this.schema = options.schema
    } else {
      this.schema = this.defineSchema()
    }
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
   * Function doesnt set the schema! It returns it, so the constructor can set it.
   * @returns {{}}
   */
  defineSchema() {
    return (
      {}
    )
  }

  /**
   * Hook method
   */
  init() {}

  setConfig() {}

  // -----------------------------------------------------------------------------------------------
  //  Public API
  // -----------------------------------------------------------------------------------------------

  /**
   * Is contract valid?
   * @returns {boolean}
   */
  isValid() {
    this.isValidState = true // if an error occurs it will set it to false during _validate execution.
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
    if ("" === inputObject || undefined === inputObject) {
      this.isAssignedEmpty = true
      return
    }

    for (let key of Object.keys(_currentScope)) {
      let value = _currentScope[key]
      let inputValueKey = value.parseAs || value.as || key
      let inputValue = this.getValueAtPath(_parsedDepth.concat(inputValueKey), inputObject)
      if (undefined === inputValue) continue

      if (undefined !== value.dType) {
        switch (value.dType) {
          case "Array":
            for (let index = 0; index < inputValue.length; index++) {
              if (undefined === value.arrayOf) console.error("Type of array must be defined in arrayOf: " + _depth.concat(key).join("."))
              if ("string" === typeof value.arrayOf) {
                this.setValueAtPath(_depth.concat(key).concat(index), inputValue[index] || this._defaultEmptyValueFor(value.arrayOf))
              } else {  // must be a contract, but may fail if nonsense provided
                let nestedContract = this._defaultEmptyValueFor("Contract", value.arrayOf)
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
    depth.reduce((o,p,i) => o[p] = depth.length === ++i ? value : o[p] || {}, object)
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
   * Returns clean hash object with filled data for sending, according to contract schema.
   * Not safe if not validated before!
   * @param _depth
   * @param _currentScope
   * @returns {{}}
   */
  toHash(_depth = [], _currentScope = this.schema) {
    let out = {}
    for (let key of Object.keys(_currentScope)) {
      let value = _currentScope[key]
      let renderKey = value.renderAs || value.as || key

      if (undefined !== value.dType) {
        switch (value.dType) {
          case "Array":
            out[renderKey] = this.getValueAtPath(_depth.concat(key)).map((element) => {
              if ("string" === typeof value.arrayOf) {
                return element
              } else {
                return element.toHash()
              }
            })
            break
          case "Contract":
            out[renderKey] = this.getValueAtPath(_depth.concat(key)).toHash()
            break
          default:
            out[renderKey] = this.getValueAtPath(_depth.concat(key))
        }
      } else {
        out[renderKey] = this.toHash(_depth.concat(key), value)
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
    for (let key of Object.keys(schema)) {
      let value = schema[key]
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
    switch (config.dType) {
      case "String":
        this.setValueAtPath(depth, config["default"] || this._defaultEmptyValueFor(config.dType))
        break
      case "Number":
        this.setValueAtPath(depth, config["default"] || this._defaultEmptyValueFor(config.dType))
        break
      case "Boolean":
        this.setValueAtPath(depth, config["default"] || this._defaultEmptyValueFor(config.dType))
        break
      case "Generic":
        this.setValueAtPath(depth, config["default"] || this._defaultEmptyValueFor(config.dType))
        break
      case "Array":
        this.setValueAtPath(depth, config["default"] || this._defaultEmptyValueFor(config.dType))
        break
      case "Contract":
        this.setValueAtPath(depth, this._defaultEmptyValueFor(config.dType, config.contract))
        break
      default:
        console.warn("Wrong dType: " + config.dType + " for: " + depth + ". Assuming Generic dType.")
        this.setValueAtPath(depth, config["default"] || this._defaultEmptyValueFor(config.dType))
    }
    this.setValueAtPath(["errors"].concat(depth), undefined)
  }

  /**
   * Returns a default empty value for a dType. Provide Contract-Class or schema-definition for nested empty contract!
   * @param dType
   * @param contract contract Class or definition for empty contract
   * @returns {*[]|string|*|null|[]|string|undefined}
   * @private
   */
  _defaultEmptyValueFor(dType, contract) {
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
          newContract = new contract({ initNested: this.initNested, initAll: this.initAll })
        } else {
          newContract = new Index({ schema: contract, initNested: this.initNested, initAll: this.initAll })
        }
        newContract._parseParent(this)
        return newContract
      default:
        return this._defaultEmptyValueFor("Generic", undefined)
    }
  }

  /**
   * Method will be run by nested Contracts on creation, assignment and validation.
   * Following tasks are implemented:
   *   * Inherit params.all Object.
   * @param parent Parent contract instance
   * @private
   */
  _parseParent(parent) {
    // parse params
    if (undefined !== parent.contractConfig.params.all) {
      this.contractConfig.params["all"] = {
        ...parent.contractConfig.params.all,
        ...this.contractConfig.params["all"]
      }
    }
  }

}