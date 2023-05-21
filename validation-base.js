/**
 * Iterate recursively over the schema and calls _validateProperty to validate the elements.
 * Note: all functions are exported and bound to the contract instance. The bound version is private (starts with _). Always use the bound version!
 * @param schema - used for recursion
 * @param depth - used for recursion
 * @private
 */
export const validate = function (schema = this.schema, depth = []) {
  for (const key of Object.keys(schema)) {
    const value = schema[key]

    // if value has a dType, it is a property and not a nested object
    if (undefined !== value["dType"]) {
      this._validateProperty(depth.concat(key), value)
      // arrays are also properties, but they can have outer and inner validations
      if ("Array" === value.dType) this._validateArray(depth, value, key) // check inner validations
    } else {
      // if value has no dType, it is a nested object and needs to be validated recursively
      this._validate(value, depth.concat(key))
    }
  }
}

export const validateArray = function (depth, propertyConfiguration, key) {
  const elements = this.getValueAtPath(depth.concat(key))

  if (undefined === elements || 0 === elements.length) return // if no elements present nothing to validate

  // if definitions is a string, it is a dType and we can use the default validation of _validateProperty for each element
  if ("string" === typeof propertyConfiguration.arrayOf) {
    if (undefined === propertyConfiguration.innerValidate) return // if no inner validations defined, no need to do something

    // create a stubbed configuration for the inner validation
    const stubbedConfig = propertyConfiguration.innerValidate
    stubbedConfig["dType"] = propertyConfiguration.arrayOf

    // validate each element
    for (let index = 0; index < elements.length; index++) {
      this._validateProperty(depth.concat(key).concat(index), stubbedConfig)
    }
  } else { // must be a contract, but may fail if nonsense provided
    for (let index = 0; index < elements.length; index++) {
      const elementDepth = depth.concat(key).concat(index)

      // no innerValidations are allowed for contracts, but breakers may be defined
      if (undefined !== propertyConfiguration.innerValidate) {
        const {usedBreakers, outbreaksValidations} = checkBreakers(this, Object.keys(propertyConfiguration.innerValidate), elements[index], propertyConfiguration.innerValidate, "Contract", elementDepth)
        if (outbreaksValidations) continue // if a breakers matched, no need to do further validations

        const remainingValidations = Object.keys(propertyConfiguration.innerValidate).filter(f => !usedBreakers.includes(f))
        for (const validationName of remainingValidations) console.error(`Undefined or invalid validation: ${validationName} at ${elementDepth.join(".")}`)
      }

      // if element is not a function -> it is not a contract -> try creating a nested contract
      // this will most likely always be the case when values are assigned manually and not by assign-method
      if ("function" !== typeof elements[index]._parseParent) {
        const nestedContract = this._defaultEmptyValueFor("Contract", propertyConfiguration.arrayOf)
        nestedContract._parseParent(this) // set parent and its attributes like localization method
        nestedContract.assign(elements[index])
        elements[index] = nestedContract
      }

      elements[index]._parseParent(this) // set parent and its attributes like localization method
      if (!elements[index].isValid(this._validationContext)) {
        this.isValidState = false
        this.setValueAtPath(["errors"].concat(depth).concat(key).concat(`${index}`), elements[index].errors)
      }
    }
  }
}

/**
 * Validate property and set "this.isValidState" and "this.errors".
 * @param depth
 * @param propertyConfiguration
 * @private
 */
export const validateProperty = function (depth, propertyConfiguration) {
  // get all validation configs for field and return if none exist
  const validations = Object.keys(propertyConfiguration).filter(f => !this.contractConfig._nonValidationConfigs.includes(f)) // filter out non-validation configs like "default", "as", ...
  // if no validations defined, no need to do something, but this should not happen:
  // validateProperty is called for properties only. Heimdall determines the properties by checking for "dType" in the schema.
  // if there is no "dType" for an entry, validateProperty is not called.
  // Since dType is also a validation there will always be at least one validation.
  if (validations.length === 0) return

  // get the value and the dType
  const propValue = this.getValueAtPath(depth)
  const dType = propertyConfiguration.dType
  const errors = [] // basket for all errors


  // 1. STEP: check validation breakers like "allowBlank" or "validateIf"
  const {usedBreakers, outbreaksValidations} = checkBreakers(this, validations, propValue, propertyConfiguration, dType, depth)
  if (outbreaksValidations) return // if a breakers matched, no need to do further validations

  // remove the breakers and get only normal validations
  const normalValidations = validations.filter(f => !usedBreakers.includes(f))

  // 2 STEP: execute normal validations
  const usedNormalValidations = []

  if ("Contract" === dType) {
    const nestedContract = this.getValueAtPath(depth)
    nestedContract._parseParent(this) // set parent and its attributes like localization method

    if (!nestedContract.isValid(this._validationContext)) {
      this.isValidState = false
      this.setValueAtPath(["errors"].concat(depth), nestedContract.errors)
    }
    // contracts should not have normal validations and will be skipped
    // there will be an error about invalid validations in the console if there are any (see end of this function)
    usedNormalValidations.push("dType")
  } else {
    for (const validationName of validations) { // iterate over all validations
      if (undefined !== this._validations.normal[validationName]) { // check if validation is defined
        if (!this._validations.normal[validationName].check(propValue, propertyConfiguration[validationName], dType, depth, this)) { // validate -> validation returns true if valid
          const errorMessage = this._getErrorMessageFor(propValue, propertyConfiguration, dType, depth, "normal", validationName)
          errors.push(errorMessage)
          this.isValidState = false
        }

        usedNormalValidations.push(validationName)
      }

      // run custom "validation"
      if ("validate" === validationName) {
        const resultOfCustomValidation = propertyConfiguration[validationName](propValue, this, dType, depth) // it must be a function. it returns true if valid
        if ("boolean" === typeof resultOfCustomValidation) { // if it returns a boolean and is false, it is invalid, but no custom error message is provided
          if (!resultOfCustomValidation) {
            this.isValidState = false
            errors.push(this._getGenericErrorMessage())
          } // use generic error message
        } else {
          errors.push(resultOfCustomValidation)
          this.isValidState = false
        }

        usedNormalValidations.push(validationName)
      }
    }
  }


  // 3. STEP assign errors if any
  if (errors.length > 0) this.setValueAtPath(["errors"].concat(depth).concat("messages"), errors)

  // remove normal validations, and it should be empty, but if not, there are undefined validations (probably a typo in the schema)
  const remainingValidations = normalValidations.filter(f => !usedNormalValidations.includes(f))
  for (const validationName of remainingValidations) console.error("Undefined validation: " + validationName)
}

// helper function to check validation breakers like "allowBlank" or "validateIf"
const checkBreakers = (instance, validations, propValue, propertyConfiguration, dType, depth) => {
  const usedBreakers = []
  for (const breakerName of validations) {
    if (undefined !== instance._validations.breaker[breakerName]) {
      if (instance._validations.breaker[breakerName].check(propValue, propertyConfiguration[breakerName], dType, depth, instance)) {
        return {outbreaksValidations: true} // if one of the breakers return true, the field is valid
      }
      usedBreakers.push(breakerName)
    }

    // custom breaker
    if ("validateIf" === breakerName) {
      if (!propertyConfiguration[breakerName](propValue, instance, dType, depth)) return {outbreaksValidations: true}
      usedBreakers.push(breakerName)
    }
  }

  return {usedBreakers, outbreaksValidations: false}
}

export const getErrorMessageFor = function (propertyValue, propertyConfiguration, dType, depth, validationScope, validationName) {
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
      return this._validations[validationScope][validationName].i18next(propertyValue, propertyConfiguration[validationName], dType, depth, this, this.contractConfig.i18next)
    default:
      return this._validations[validationScope][validationName].message(propertyValue, propertyConfiguration[validationName], dType, depth, this)
  }
}

export const getGenericErrorMessage = function () {
  switch (this.contractConfig.localizationMethod) {
    case "i18next":
      return this.contractConfig.i18next.t("errors:generic")
    default:
      return "Field invalid!"
  }
}