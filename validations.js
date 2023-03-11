/**
 * Defines all validation functions:
 * There are following groups:
 *   - breaker  -  These will run at the beginning and if one of them succeeds the rest will be skipped.
 *   - normal  -  Usual validations, if one of them fails, the field is invalid.
 * A validation needs to define a "check" function:
 *   check function
 *   @param value - always needed
 *   @param config - nearly always needed
 *   @param dType - often helpful
 *   @param depth - optional, hopefully never needed
 *   @param contractInstance - optional, hopefully never needed
 * To get a better error output instead of just "Field invalid!", a message function can be defined. (Naturally its not for breakers)
 *   message function
 *   @param value - always needed
 *   @param config - nearly always needed
 *   @param dType - often helpful
 *   @param depth - optional, hopefully never needed
 *   @param contractInstance - optional, hopefully never needed
 */
const validationDefinitions = {
  // if these validations passes, normal validations will be skipped
  breaker: {
    // Allow Blank or empty values
    allowBlank: {
      check: (value, isAllowed, dType, depth, contract) => {
        if ("function" === typeof isAllowed) isAllowed = isAllowed(value, contract, dType, depth)
        if (undefined === isAllowed) return false
        if (!isAllowed) return false

        return (undefined === value || null === value || 0 === value.length || true === value.isAssignedEmpty)
      },
    }
  },

  normal: {
    // Data Type
    dType: {
      check: (value, dataType, dType, depth, contract) => {
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
            return false // should not be reachable unless invalid dType provided
        }
      },
      message: (value, dataType, dType, depth, contract) => {
        return value + " is not a valid " + dataType
      },
      i18next: (value, dataType, dType, depth, contract, i18n) => {
        return  i18n.t(["errors:dType." + dType, "errors:dType.default"], {value: value, dType: dType})
      },
    },

    presence: {
      check: (value, isRequired, dType, depth, contract) => {
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
      message: (value, isRequired, dType, depth, contract) => {
        return "not present"
      },
      i18next: (value, isRequired, dType, depth, contract, i18n) => {
        return i18n.t(["errors:presence.true", "errors:presence"])
      },
    },

    absence: {
      check: (value, mustBeAbsent, dType, depth, contract) => {
        if ("function" === typeof mustBeAbsent) mustBeAbsent = mustBeAbsent(value, contract, dType, depth)

        if (!mustBeAbsent) return true

        return (undefined === value || null === value || 0 === value.length)
      },
      message: (value, isRequired, dType, depth, contract) => {
        return "must be absent"
      },
      i18next: (value, isRequired, dType, depth, contract, i18n) => {
        return i18n.t(["errors:presence.false", "errors:absence.true", "errors:absence"])
      },
    },

    isEmail: {
      check: (value, mustBeEmail, dType, depth, contract) => {
        if ("function" === typeof mustBeEmail) mustBeEmail = mustBeEmail(value, contract, dType, depth)

        let isEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(value)
        return mustBeEmail ? isEmail : !isEmail
      },
      message: (value, mustBeEmail, dType, depth, contract) => {
        if ("function" === typeof mustBeEmail) mustBeEmail = mustBeEmail(value, contract, dType, depth)
        return mustBeEmail ? "must be a valid E-Mail" : "must not be an E-Mail"
      },
      i18next: (value, mustBeEmail, dType, depth, contract, i18n) => {
        if ("function" === typeof mustBeEmail) mustBeEmail = mustBeEmail(value, contract, dType, depth)
        return mustBeEmail ? i18n.t("errors:isEmail.true") : i18n.t("errors:isEmail.false")
      },
    },

    match: {
      check: (value, regex, dType, depth, contract) => {
        if ("function" === typeof regex) regex = regex(value, contract, dType, depth)

        return regex.test(value)
      },
      message: (value, regex, dType, depth, contract) => {
        return "invalid"
      },
      i18next: (value, mustBeEmail, dType, depth, contract, i18n) => {
        return i18n.t("errors:generic")
      },
    },

    only: {
      check: (value, allowedValues, dType, depth, contract) => {
        if ("function" === typeof allowedValues) allowedValues = allowedValues(value, contract, dType, depth)

        return "object" === typeof allowedValues ? allowedValues.includes(value) : allowedValues === value
      },
      message: (value, allowedValues, dType, depth, contract) => {
        if ("function" === typeof allowedValues) allowedValues = allowedValues(value, contract, dType, depth)
        if ("object" === typeof allowedValues && allowedValues.length < 2) allowedValues = allowedValues[0]
        if ("object" === typeof allowedValues) {
          return "must be " + allowedValues.slice(0,-1).join(",") + " or " + allowedValues[allowedValues.length]
        } else {
          return "must be " + allowedValues
        }
      },
      i18next: (value, allowedValues, dType, depth, contract, i18n) => {
        if ("function" === typeof allowedValues) allowedValues = allowedValues(value, contract, dType, depth)
        if ("object" === typeof allowedValues && allowedValues.length < 2) allowedValues = allowedValues[0]
        if ("object" === typeof allowedValues) {
          return i18n.t("errors:only.plural", { elements: allowedValues.slice(0,-1).join(","), lastElement: allowedValues[allowedValues.length] })
        } else {
          return i18n.t("errors:only.singular", { element: allowedValues })
        }
      },
    },

    min: {
      check: (value, minCount, dType, depth, contract) => {
        if ("function" === typeof minCount) minCount = minCount(value, contract, dType, depth)

        if ("String" === dType || "Array" === dType) return value.length >= minCount
        if ("Number" === dType) return value >= minCount
        console.error("Invalid dType: " + dType + " for minimum validation on field '" + depth + "'")
        return true
      },
      message: (value, minCount, dType, depth, contract) => {
        if ("function" === typeof minCount) minCount = minCount(value, contract, dType, depth)
        if ("String" === dType) return "must have at least " + minCount + " characters"
        if ("Array" === dType) return "must have at least " + minCount + " elements"
        if ("Number" === dType) return "must have be greater than " + (minCount - 1)
      },
      i18next: (value, minCount, dType, depth, contract, i18n) => {
        if ("function" === typeof minCount) minCount = minCount(value, contract, dType, depth)
        if ("Number" === dType) minCount -= 1
        return i18n.t("errors:min." + dType, { minCount: minCount })
      },
    },
  }
}

export default validationDefinitions