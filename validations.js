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
export const validationDefinitions = {
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
    },
    // validate only if validation context matches
    // if context matches, no outbreak -> return false
    on: {
      check: (value, contextOfProperty, dType, depth, contract) => {
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
            console.error("Invalid dType provided: " + dataType)
            return false // should not be reachable unless invalid dType provided
        }
      },
      message: (value, dataType, dType, depth, contract) => {
        return `"${value}" is not a valid ${dataType}`
      },
      i18next: (value, dataType, dType, depth, contract, i18n) => {
        return i18n.t([`errors:dType.${dType}`, "errors:dType.default"], {value: value, dType: dType})
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

        const isEmail = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value)
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

    // intuitive only validation:
    // - magical array handling: if value is an array, it is valid if value is included in the allowedValues array
    only: {
      check: (value, allowedValues, dType, depth, contract) => {
        if ("function" === typeof allowedValues) allowedValues = allowedValues(value, contract, dType, depth)

        const isValueEmpty = undefined === value || null === value || 0 === value?.length
        if (isValueEmpty) return true

        if (Array.isArray(allowedValues)) {
          return Array.isArray(value) ? value.every(v => allowedValues.includes(v)) : allowedValues.includes(value)
        } else {
          return allowedValues === value
        }
      },
      message: (value, allowedValues, dType, depth, contract) => {
        if ("function" === typeof allowedValues) allowedValues = allowedValues(value, contract, dType, depth)
        if (Array.isArray(allowedValues) && allowedValues.length < 2) allowedValues = allowedValues[0]
        if (Array.isArray(allowedValues)) {
          return `must be "${allowedValues.slice(0, -1).join(",")}" or "${allowedValues[allowedValues.length - 1]}"`
        } else {
          return `must be "${allowedValues}"`
        }
      },
      i18next: (value, allowedValues, dType, depth, contract, i18n) => {
        if ("function" === typeof allowedValues) allowedValues = allowedValues(value, contract, dType, depth)
        if ("object" === typeof allowedValues && allowedValues.length < 2) allowedValues = allowedValues[0]
        if ("object" === typeof allowedValues) {
          return i18n.t("errors:only.plural", {elements: allowedValues.slice(0, -1).join(","), lastElement: allowedValues[allowedValues.length - 1]})
        } else {
          return i18n.t("errors:only.singular", {element: allowedValues})
        }
      },
    },

    strictOnly: {
      check: (value, allowedValues, dType, depth, contract) => {
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
      message: (value, allowedValues, dType, depth, contract) => {
        if ("function" === typeof allowedValues) allowedValues = allowedValues(value, contract, dType, depth)

        if (Array.isArray(allowedValues) && allowedValues.length < 2 && !["Array", "Generic"].includes(dType)) allowedValues = allowedValues[0]
        if (Array.isArray(allowedValues) && !["Array", "Generic"].includes(dType)) {
          return `must be "${allowedValues.slice(0, -1).join(",")}" or "${allowedValues[allowedValues.length - 1]}"`
        } else {
          return `must be "${allowedValues}"`
        }
      },
      i18next: (value, allowedValues, dType, depth, contract, i18n) => {
        if ("function" === typeof allowedValues) allowedValues = allowedValues(value, contract, dType, depth)

        if (Array.isArray(allowedValues) && allowedValues.length < 2 && !["Array", "Generic"].includes(dType)) allowedValues = allowedValues[0]
        if (Array.isArray(allowedValues) && !["Array", "Generic"].includes(dType)) {
          return i18n.t("errors:strictOnly.plural", {elements: allowedValues.slice(0, -1).join(","), lastElement: allowedValues[allowedValues.length - 1]})
        } else {
          return i18n.t("errors:strictOnly.singular", {element: allowedValues})
        }
      },
    },


    min: {
      check: (value, minCount, dType, depth, contract) => {
        if ("function" === typeof minCount) minCount = minCount(value, contract, dType, depth)

        const isComparableString = "String" === dType && "string" === typeof value
        const isComparableArray = "Array" === dType && Array.isArray(value)
        if (isComparableString || isComparableArray) return value.length >= minCount

        if ("Number" === dType && "number" === typeof value) return value >= minCount

        console.error(`Invalid dType: ${dType} for minimum validation on field '${depth}'`)
        return true
      },
      message: (value, minCount, dType, depth, contract) => {
        if ("function" === typeof minCount) minCount = minCount(value, contract, dType, depth)
        if ("String" === dType) return `must have at least ${minCount} characters`
        if ("Array" === dType) return `must have at least ${minCount} elements`
        if ("Number" === dType) return `must be greater than or equal to ${minCount}`
      },
      i18next: (value, minCount, dType, depth, contract, i18n) => {
        if ("function" === typeof minCount) minCount = minCount(value, contract, dType, depth)
        return i18n.t("errors:min." + dType, {minCount})
      },
    },

    max: {
      check: (value, maxCount, dType, depth, contract) => {
        if ("function" === typeof maxCount) maxCount = maxCount(value, contract, dType, depth)

        const isComparableString = "String" === dType && "string" === typeof value
        const isComparableArray = "Array" === dType && Array.isArray(value)
        if (isComparableString || isComparableArray) return value.length <= maxCount

        if ("Number" === dType && "number" === typeof value) return value <= maxCount
        console.error(`Invalid dType: ${dType} for maximum validation on field '${depth}'`)
        return true
      },
      message: (value, maxCount, dType, depth, contract) => {
        if ("function" === typeof maxCount) maxCount = maxCount(value, contract, dType, depth)
        if ("String" === dType) return `must have less than ${maxCount} characters`
        if ("Array" === dType) return `must have less than ${maxCount} elements`
        if ("Number" === dType) return `must be lower or equal than ${maxCount}`
      },
      i18next: (value, maxCount, dType, depth, contract, i18n) => {
        if ("function" === typeof maxCount) maxCount = maxCount(value, contract, dType, depth)
        return i18n.t("errors:max." + dType, {maxCount})
      },
    },
  }
}