import _validations from "./validations.js"

/**
 * Iterate recursively over the schema and call _validateProperty to validate the elements.
 * @param schema - used for recursion
 * @param depth - used for recursion
 * @private
 */
export const validate = function(schema = this.schema, depth = []) {
  for (let key of Object.keys(schema)) {
    let value = schema[key]
    if (undefined !== value["dType"]) {
      this._validateProperty(depth.concat(key), value)
      if ("Array" === value.dType) this._validateArray(depth, value, key)
    } else {
      this._validate(value, depth.concat(key))
    }
  }
}

export const validateArray = function(depth, propertyConfiguration, key) {
  let elements = this.getValueAtPath(depth.concat(key))
  if (undefined === elements || 0 === elements.length) return true // if no elements presents nothing to validate
  if ("string" === typeof propertyConfiguration.arrayOf) {
    if (undefined === propertyConfiguration.innerValidate) return true // if no validations defined, no need to do something
    let stubbedConfig = propertyConfiguration.innerValidate
    stubbedConfig["dType"] = propertyConfiguration.arrayOf
    for (let index = 0; index < elements.length; index++) {
      this._validateProperty(depth.concat(key).concat(index), stubbedConfig)
    }
    return true
  } else { // must be a contract, but may fail if nonsense provided
    for (let index = 0; index < elements.length; index++) {
      elements[index]._parseParent(this)
      if (!elements[index].isValid()) this.isValidState = false
      this.setValueAtPath(["errors"].concat(depth).concat(key).concat(index), elements[index].errors)
    }
  }
}

/**
 * Validate property and set "this.isValidState" and "this.errors".
 * @param depth
 * @param propertyConfiguration
 * @private
 * @returns {Boolean} - validState of field (not used atm)
 */
export const validateProperty = function(depth, propertyConfiguration) {
  // get all validation configs for field and return if none exist
  let validations = Object.keys(propertyConfiguration).filter(f => !this.contractConfig._nonValidationConfigs.includes(f))
  if (validations.length < 1) return
  // get the value and the dType
  let propValue = this.getValueAtPath(depth)
  let dType = propertyConfiguration.dType
  // remove old errors
  this.setValueAtPath(["errors"].concat(depth), undefined)
  let errors = []

  // 1. STEP: check validation breakers like "allowBlank"
  let usedBreakers = []
  for (let breakerName of validations) {
    if(undefined !== _validations.breaker[breakerName]) {
      if (_validations.breaker[breakerName].check(propValue, propertyConfiguration[breakerName], dType, depth, this)) {
        return true // if one of the breakers return true, the field is valid
      }
      usedBreakers.push(breakerName)
    }
    // custom breaker
    if ("validateIf" === breakerName) {
      if (propertyConfiguration[breakerName](propValue, this, dType, depth)) return true
      usedBreakers.push(breakerName)
    }
  }
  // remove the breakers from validations Array
  validations = validations.filter(f => !usedBreakers.includes(f))

  // 2 STEP: execute normal validations
  let usedNormalValidations = []

  // contracts should not have normal validations
  if ("Contract" == dType) {
    let nestedContract = this.getValueAtPath(depth)
    nestedContract._parseParent(this)
    if (!nestedContract.isValid()) this.isValidState = false
    this.setValueAtPath(["errors"].concat(depth), nestedContract.errors)
    usedNormalValidations.push("dType")
  } else {
    for (let validationName of validations) {
      if(undefined !== _validations.normal[validationName]) {
        if (!_validations.normal[validationName].check(propValue, propertyConfiguration[validationName], dType, depth, this)) {
          let errorMessage =
            this._getErrorMessageFor(
              propValue,
              propertyConfiguration,
              dType,
              depth,
              "normal",
              validationName
            )

          if (errorMessage) errors.push(errorMessage)
          this.isValidState = false
        }
        usedNormalValidations.push(validationName)
      }
      // run custom validation
      if ("validate" === validationName) {
        let resultOfCustomValidation = propertyConfiguration[validationName](propValue, this, dType, depth)
        if ("boolean" === typeof resultOfCustomValidation) {
          if (!resultOfCustomValidation) errors.push(this._getGenericErrorMessage())
        } else {
          if (!resultOfCustomValidation[0]) errors.push(resultOfCustomValidation[1])
        }
        usedNormalValidations.push(validationName)
      }
    }
  }
  // remove the breakers from validations Array
  validations = validations.filter(f => !usedNormalValidations.includes(f))

  // 3 STEP: assign errors
  this.setValueAtPath(["errors"].concat(depth).concat("messages"), errors)

  // ADDITIONAL STEP: inform about unused validations!
  if (validations.length > 0) {
    for (let validationName of validations) {
      console.error("Undefined validation: " + validationName)
    }
  }
}

export const getErrorMessageFor = function(propertyValue, propertyConfiguration, dType, depth, validationScope, validationName) {
  if (undefined !== propertyConfiguration.errorMessage) {
    if ("string" === typeof propertyConfiguration.errorMessage) return propertyConfiguration.errorMessage
    if ("function" === typeof propertyConfiguration.errorMessage) return propertyConfiguration.errorMessage(propertyValue, this, validationName, dType, depth, validationScope)

    if ("string" === typeof propertyConfiguration.errorMessage[validationName]) return propertyConfiguration.errorMessage[validationName]
    if ("function" === typeof propertyConfiguration.errorMessage[validationName]) return propertyConfiguration.errorMessage[validationName](propertyValue, this, validationName, dType, depth, validationScope)

    if ("string" === typeof propertyConfiguration.errorMessage.default) return propertyConfiguration.errorMessage.default
    if ("function" === typeof propertyConfiguration.errorMessage.default) return propertyConfiguration.errorMessage.default(propertyValue, this, validationName, dType, depth, validationScope)
  }
  switch (this.contractConfig.localizationMethod) {
    case "i18next":
      return _validations[validationScope][validationName].i18next(propertyValue, propertyConfiguration[validationName], dType, depth, this, this.contractConfig.i18next)
    default:
      return _validations[validationScope][validationName].message(propertyValue, propertyConfiguration[validationName], dType, depth, this)
  }
}

export const getGenericErrorMessage = function() {
  switch (this.contractConfig.localizationMethod) {
    case "i18next":
      return this.contractConfig.i18next.t("errors:generic")
    default:
      return "Field invalid!"
  }
}