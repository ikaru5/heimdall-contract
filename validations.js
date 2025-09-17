/**
 * Defines all validation functions using named parameters for improved code maintainability.
 * 
 * There are following validation groups:
 *   - breaker  -  These run at the beginning and if one succeeds, the remaining validations are skipped.
 *   - normal   -  Standard validations; if one fails, the field is considered invalid.
 * 
 * Each validation requires a "check" function that uses destructured named parameters:
 * 
 * @typedef {Object} CheckParams
 * @property {*} value - The value being validated (always provided)
 * @property {*} config - The validation configuration (nearly always needed)
 * @property {string} dType - The data type (often helpful for type-specific validation)
 * @property {Array<string>} depth - The field path depth (optional, used for nested objects)
 * @property {Object} contract - The contract instance (optional, provides context)
 * 
 * check function signature: ({value, config, dType, depth, contract}) => boolean
 * 
 * For better error messages instead of generic "Field invalid!", a message function can be defined.
 * Note: Message functions are not used for breaker validations.
 * 
 * @typedef {Object} MessageParams
 * @property {*} value - The value being validated (always provided)
 * @property {*} config - The validation configuration (nearly always needed)
 * @property {string} dType - The data type (often helpful for type-specific messages)
 * @property {Array<string>} depth - The field path depth (optional, used for nested objects)
 * @property {Object} contract - The contract instance (optional, provides context)
 * @property {Function} customLocalization - Custom localization function (optional, like i18next)
 * 
 * message function signature: ({value, config, dType, depth, contract, customLocalization}) => string
 */
export const validationDefinitions = {
  // if these validations passes, normal validations will be skipped
  breaker: {
    // Allow Blank or empty values
    allowBlank: {
      /**
       * Checks if blank values are allowed for this field
       * @param {CheckParams} params - Destructured parameters
       * @returns {boolean} True if validation should be skipped (breaker behavior)
       */
      check: ({value, config: isAllowed, dType, depth, contract}) => {
        if ("function" === typeof isAllowed) isAllowed = isAllowed(value, contract, dType, depth)
        if (undefined === isAllowed) return false
        if (!isAllowed) return false

        return (undefined === value || null === value || 0 === value.length || true === value.isAssignedEmpty)
      },
    },
    // validate only if validation context matches
    // if context matches, no outbreak -> return false
    on: {
      /**
       * Checks if the current validation context matches the field's context requirement
       * @param {CheckParams} params - Destructured parameters
       * @returns {boolean} True if validation should be skipped (breaker behavior)
       */
      check: ({value, config: contextOfProperty, dType, depth, contract}) => {
        const checkSingleContext = (context) => {
          if (context === contextOfProperty) return false
          if (context === "matchAnyContext") return false
          return !(Array.isArray(contextOfProperty) && contextOfProperty.includes(context));
        }

        // if multiple contexts are provided, check if any of them matches
        if (Array.isArray(contract._validationContext)) {
          for (const context of contract._validationContext) {
            if (!checkSingleContext(context)) return false
          }
        } else {
          // reuse checkSingleContext function for single context :D
          return checkSingleContext(contract._validationContext)
        }

        return true // if no context matches, outbreak
      },
    }
  },

  normal: {
    // Data Type
    dType: {
      /**
       * Validates that the value matches the expected data type
       * @param {CheckParams} params - Destructured parameters
       * @returns {boolean} True if the value matches the expected data type
       */
      check: ({value, config: dataType, dType, depth, contract}) => {
        switch (dataType) {
          case "String":
            return "string" === typeof value
          case "Number":
            return "number" === typeof value
          case "Boolean":
            return "boolean" === typeof value
          case "Generic":
            return true
          case "Array":
            return "object" === typeof value && "number" === typeof value.length
          default:
            console.error("Invalid dType provided: " + dataType)
            return false // should not be reachable unless invalid dType provided
        }
      },
      /**
       * Generates error message for data type validation failure
       * @param {MessageParams} params - Destructured parameters
       * @returns {string} Error message describing the data type mismatch
       */
      message: ({value, config: dataType, dType, depth, contract, customLocalization}) => {
        if (customLocalization) {
          return customLocalization({
            translationKey: `errors:dType.${dType}`, 
            translationKeys: [`errors:dType.${dType}`, "errors:dType.default"], 
            fallbackValue: `"${value}" is not a valid ${dataType}`, 
            context: {value, dType, depth, contract}
          })
        }
        return `"${value}" is not a valid ${dataType}`
      },
    },

    presence: {
      /**
       * Validates that a required field has a value
       * @param {CheckParams} params - Destructured parameters
       * @returns {boolean} True if the field is not required or has a valid value
       */
      check: ({value, config: isRequired, dType, depth, contract}) => {
        if ("function" === typeof isRequired) isRequired = isRequired(value, contract, dType, depth)

        if (!isRequired) return true

        switch (dType) {
          case "String":
            return ("string" === typeof value && 0 < value.length)
          case "Number":
            return "number" === typeof value
          case "Boolean":
            return "boolean" === typeof value
          case "Generic":
            return undefined !== value && null !== value
          case "Array":
            return ("object" === typeof value && 0 < value.length)
          default:
            return false // should not be reachable unless invalid dType provided
        }
      },
      /**
       * Generates error message for presence validation failure
       * @param {MessageParams} params - Destructured parameters
       * @returns {string} Error message indicating the field is not present
       */
      message: ({value, config: isRequired, dType, depth, contract, customLocalization}) => {
        if (customLocalization) {
          return customLocalization({
            translationKey: "errors:presence.true",
            translationKeys: ["errors:presence.true", "errors:presence"], 
            fallbackValue: "not present", 
            context: {value, dType, depth, contract}
          })
        }
        return "not present"
      },
    },

    absence: {
      /**
       * Validates that a field is absent (empty/undefined) when required
       * @param {CheckParams} params - Destructured parameters
       * @returns {boolean} True if the field is not required to be absent or is actually absent
       */
      check: ({value, config: mustBeAbsent, dType, depth, contract}) => {
        if ("function" === typeof mustBeAbsent) mustBeAbsent = mustBeAbsent(value, contract, dType, depth)

        if (!mustBeAbsent) return true

        return (undefined === value || null === value || 0 === value.length)
      },
      /**
       * Generates error message for absence validation failure
       * @param {MessageParams} params - Destructured parameters
       * @returns {string} Error message indicating the field must be absent
       */
      message: ({value, config: isRequired, dType, depth, contract, customLocalization}) => {
        if (customLocalization) {
          return customLocalization({
            translationKey: "errors:presence.false",
            translationKeys: ["errors:presence.false", "errors:absence.true", "errors:absence"], 
            fallbackValue: "must be absent", 
            context: {value, dType, depth, contract}
          })
        }
        return "must be absent"
      },
    },

    isEmail: {
      /**
       * Validates that a value is or is not a valid email address
       * @param {CheckParams} params - Destructured parameters
       * @returns {boolean} True if email validation requirement is met
       */
      check: ({value, config: mustBeEmail, dType, depth, contract}) => {
        if ("function" === typeof mustBeEmail) mustBeEmail = mustBeEmail(value, contract, dType, depth)

        const isEmail = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value)
        return mustBeEmail ? isEmail : !isEmail
      },
      /**
       * Generates error message for email validation failure
       * @param {MessageParams} params - Destructured parameters
       * @returns {string} Error message about email validation failure
       */
      message: ({value, config: mustBeEmail, dType, depth, contract, customLocalization}) => {
        if ("function" === typeof mustBeEmail) mustBeEmail = mustBeEmail(value, contract, dType, depth)
        if (customLocalization) {
          const translationKey = mustBeEmail ? "errors:isEmail.true" : "errors:isEmail.false"
          const fallbackValue = mustBeEmail ? "must be a valid E-Mail" : "must not be an E-Mail"
          return customLocalization({
            translationKey: translationKey, 
            translationKeys: [translationKey], 
            fallbackValue: fallbackValue, 
            context: {value, dType, depth, contract}
          })
        }
        return mustBeEmail ? "must be a valid E-Mail" : "must not be an E-Mail"
      },
    },

    match: {
      /**
       * Validates that a value matches a regular expression pattern
       * @param {CheckParams} params - Destructured parameters
       * @returns {boolean} True if the value matches the regex pattern
       */
      check: ({value, config: regex, dType, depth, contract}) => {
        if ("function" === typeof regex) regex = regex(value, contract, dType, depth)

        return regex.test(value)
      },
      /**
       * Generates error message for regex match validation failure
       * @param {MessageParams} params - Destructured parameters
       * @returns {string} Generic error message for regex validation failure
       */
      message: ({value, config: regex, dType, depth, contract, customLocalization}) => {
        if (customLocalization) {
          return customLocalization({
            translationKey: "errors:generic",
            translationKeys: ["errors:generic"], 
            fallbackValue: "invalid", 
            context: {value, dType, depth, contract}
          })
        }
        return "invalid"
      },
    },

    // intuitive only validation:
    // - magical array handling: if value is an array, it is valid if value is included in the allowedValues array
    only: {
      /**
       * Validates that a value is within the allowed values (with flexible array handling)
       * @param {CheckParams} params - Destructured parameters
       * @returns {boolean} True if the value is among the allowed values or is empty
       */
      check: ({value, config: allowedValues, dType, depth, contract}) => {
        if ("function" === typeof allowedValues) allowedValues = allowedValues(value, contract, dType, depth)

        const isValueEmpty = undefined === value || null === value || 0 === value?.length
        if (isValueEmpty) return true

        if (Array.isArray(allowedValues)) {
          return Array.isArray(value) ? value.every(v => allowedValues.includes(v)) : allowedValues.includes(value)
        } else {
          return allowedValues === value
        }
      },
      /**
       * Generates error message for only validation failure
       * @param {MessageParams} params - Destructured parameters
       * @returns {string} Error message listing the allowed values
       */
      message: ({value, config: allowedValues, dType, depth, contract, customLocalization}) => {
        if ("function" === typeof allowedValues) allowedValues = allowedValues(value, contract, dType, depth)
        if (customLocalization) {
          if ("object" === typeof allowedValues && allowedValues.length < 2) allowedValues = allowedValues[0]
          if ("object" === typeof allowedValues) {
            return customLocalization({
              translationKey: "errors:only.plural", 
              translationKeys: ["errors:only.plural"], 
              fallbackValue: `must be "${allowedValues.slice(0, -1).join(",")}" or "${allowedValues[allowedValues.length - 1]}"`, 
              context: {value, dType, depth, contract, elements: allowedValues.slice(0, -1).join(","), lastElement: allowedValues[allowedValues.length - 1]}
            })
          } else {
            return customLocalization({
              translationKey: "errors:only.singular", 
              translationKeys: ["errors:only.singular"], 
              fallbackValue: `must be "${allowedValues}"`, 
              context: {value, dType, depth, contract, element: allowedValues}
            })
          }
        }
        if (Array.isArray(allowedValues) && allowedValues.length < 2) allowedValues = allowedValues[0]
        if (Array.isArray(allowedValues)) {
          return `must be "${allowedValues.slice(0, -1).join(",")}" or "${allowedValues[allowedValues.length - 1]}"`
        } else {
          return `must be "${allowedValues}"`
        }
      },
    },

    strictOnly: {
      /**
       * Validates that a value strictly matches one of the allowed values (no flexible array handling)
       * @param {CheckParams} params - Destructured parameters
       * @returns {boolean} True if the value strictly matches an allowed value or is empty
       */
      check: ({value, config: allowedValues, dType, depth, contract}) => {
        if ("function" === typeof allowedValues) allowedValues = allowedValues(value, contract, dType, depth)

        const isValueEmpty = undefined === value || null === value || 0 === value?.length
        if (isValueEmpty) return true

        if (Array.isArray(allowedValues)) {
          return ["Array", "Generic"].includes(dType) ?
            JSON.stringify(value) === JSON.stringify(allowedValues) :
            allowedValues.includes(value)
        }

        return allowedValues === value
      },
      /**
       * Generates error message for strictOnly validation failure
       * @param {MessageParams} params - Destructured parameters
       * @returns {string} Error message listing the strictly allowed values
       */
      message: ({value, config: allowedValues, dType, depth, contract, customLocalization}) => {
        if ("function" === typeof allowedValues) allowedValues = allowedValues(value, contract, dType, depth)
        if (customLocalization) {
          if (Array.isArray(allowedValues) && allowedValues.length < 2 && !["Array", "Generic"].includes(dType)) allowedValues = allowedValues[0]
          if (Array.isArray(allowedValues) && !["Array", "Generic"].includes(dType)) {
            return customLocalization({
              translationKey: "errors:strictOnly.plural", 
              translationKeys: ["errors:strictOnly.plural"], 
              fallbackValue: `must be "${allowedValues.slice(0, -1).join(",")}" or "${allowedValues[allowedValues.length - 1]}"`, 
              context: {value, dType, depth, contract, elements: allowedValues.slice(0, -1).join(","), lastElement: allowedValues[allowedValues.length - 1]}
            })
          } else {
            return customLocalization({
              translationKey: "errors:strictOnly.singular", 
              translationKeys: ["errors:strictOnly.singular"], 
              fallbackValue: `must be "${allowedValues}"`, 
              context: {value, dType, depth, contract, element: allowedValues}
            })
          }
        }
        if (Array.isArray(allowedValues) && allowedValues.length < 2 && !["Array", "Generic"].includes(dType)) allowedValues = allowedValues[0]
        if (Array.isArray(allowedValues) && !["Array", "Generic"].includes(dType)) {
          return `must be "${allowedValues.slice(0, -1).join(",")}" or "${allowedValues[allowedValues.length - 1]}"`
        } else {
          return `must be "${allowedValues}"`
        }
      },
    },


    min: {
      /**
       * Validates that a value meets minimum requirements (length for strings/arrays, value for numbers)
       * @param {CheckParams} params - Destructured parameters
       * @returns {boolean} True if the value meets the minimum requirement
       */
      check: ({value, config: minCount, dType, depth, contract}) => {
        if ("function" === typeof minCount) minCount = minCount(value, contract, dType, depth)

        const isComparableString = "String" === dType && "string" === typeof value
        const isComparableArray = "Array" === dType && Array.isArray(value)
        if (isComparableString || isComparableArray) return value.length >= minCount

        if ("Number" === dType && "number" === typeof value) return value >= minCount

        console.error(`Invalid dType: ${dType} for minimum validation on field '${depth}'`)
        return true
      },
      /**
       * Generates error message for minimum validation failure
       * @param {MessageParams} params - Destructured parameters
       * @returns {string} Error message describing the minimum requirement
       */
      message: ({value, config: minCount, dType, depth, contract, customLocalization}) => {
        if ("function" === typeof minCount) minCount = minCount(value, contract, dType, depth)
        if (customLocalization) {
          const translationKey = `errors:min.${dType}`
          let fallbackValue = ""
          if ("String" === dType) fallbackValue = `must have at least ${minCount} characters`
          if ("Array" === dType) fallbackValue = `must have at least ${minCount} elements`
          if ("Number" === dType) fallbackValue = `must be greater than or equal to ${minCount}`
          return customLocalization({
            translationKey: translationKey, 
            translationKeys: [translationKey], 
            fallbackValue: fallbackValue, 
            context: {value, dType, depth, contract, minCount}
          })
        }
        if ("String" === dType) return `must have at least ${minCount} characters`
        if ("Array" === dType) return `must have at least ${minCount} elements`
        if ("Number" === dType) return `must be greater than or equal to ${minCount}`
      },
    },

    max: {
      /**
       * Validates that a value meets maximum requirements (length for strings/arrays, value for numbers)
       * @param {CheckParams} params - Destructured parameters
       * @returns {boolean} True if the value meets the maximum requirement
       */
      check: ({value, config: maxCount, dType, depth, contract}) => {
        if ("function" === typeof maxCount) maxCount = maxCount(value, contract, dType, depth)

        const isComparableString = "String" === dType && "string" === typeof value
        const isComparableArray = "Array" === dType && Array.isArray(value)
        if (isComparableString || isComparableArray) return value.length <= maxCount

        if ("Number" === dType && "number" === typeof value) return value <= maxCount
        console.error(`Invalid dType: ${dType} for maximum validation on field '${depth}'`)
        return true
      },
      /**
       * Generates error message for maximum validation failure
       * @param {MessageParams} params - Destructured parameters
       * @returns {string} Error message describing the maximum requirement
       */
      message: ({value, config: maxCount, dType, depth, contract, customLocalization}) => {
        if ("function" === typeof maxCount) maxCount = maxCount(value, contract, dType, depth)
        if (customLocalization) {
          const translationKey = `errors:max.${dType}`
          let fallbackValue = ""
          if ("String" === dType) fallbackValue = `must have less than ${maxCount} characters`
          if ("Array" === dType) fallbackValue = `must have less than ${maxCount} elements`
          if ("Number" === dType) fallbackValue = `must be lower or equal than ${maxCount}`
          return customLocalization({
            translationKey: translationKey, 
            translationKeys: [translationKey], 
            fallbackValue: fallbackValue, 
            context: {value, dType, depth, contract, maxCount}
          })
        }
        if ("String" === dType) return `must have less than ${maxCount} characters`
        if ("Array" === dType) return `must have less than ${maxCount} elements`
        if ("Number" === dType) return `must be lower or equal than ${maxCount}`
      },
    },
  }
}