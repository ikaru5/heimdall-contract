[back to root](../README.md#Documentation)

# Localization

There are built-in English error messages. You can localize these error messages to your needs using a flexible callback system.

## Custom Localization Callback

Heimdall Contract uses a universal callback system for localization. You can integrate any translation library by providing a `customLocalization` function in your base contract.

### Callback Signature

```javascript
customLocalization = ({translationKey, translationKeys, fallbackValue, context}) => string | undefined | null
```

**Parameters:**
- `translationKey`: Primary translation key (string)
- `translationKeys`: Array of fallback keys for advanced translation systems (array)
- `fallbackValue`: Fallback value when no translation is found (string)
- `context`: Object with context data ({value, dType, config, depth, contract})

### Basic Implementation

```javascript
export default class Contract extends ContractBase {
  setConfig() {
    this.contractConfig.customLocalization = ({translationKey, translationKeys, fallbackValue, context}) => {
      // Your custom translation logic here
      // Return translated string, or undefined/null to use fallbackValue
      return myTranslationLibrary.translate(translationKey) || fallbackValue
    }
  }
}
```

## i18next Integration

The most common use case is integrating with i18next. Here's how to set it up:

```javascript
import i18next from 'i18next'

export default class Contract extends ContractBase {
  setConfig() {
    this.contractConfig.customLocalization = ({translationKey, translationKeys, fallbackValue, context}) => {
      // Use translationKeys array for i18next fallback support, or single translationKey
      const key = translationKeys && translationKeys.length > 1 ? translationKeys : translationKey
      
      // Pass context data to i18next for interpolation
      return i18next.t(key, { 
        defaultValue: fallbackValue,
        ...context 
      })
    }
  }
}
```

### Translation Keys Used by Heimdall

Heimdall uses the following translation key patterns:

```javascript
// Data type validation
"errors:dType.String"
"errors:dType.Number" 
"errors:dType.Boolean"
"errors:dType.default"

// Presence/absence validation
"errors:presence.true"
"errors:presence"
"errors:presence.false"
"errors:absence.true"
"errors:absence"

// Email validation
"errors:isEmail.true"
"errors:isEmail.false"

// Min/max validation
"errors:min.String"
"errors:min.Number"
"errors:min.Array"
"errors:max.String" 
"errors:max.Number"
"errors:max.Array"

// Only/strictOnly validation
"errors:only.singular"
"errors:only.plural"
"errors:strictOnly.singular"
"errors:strictOnly.plural"

// Generic fallback
"errors:generic"
```

### Example i18next Translation File

```json
{
  "errors": {
    "generic": "Field invalid!",
    "dType": {
      "String": "\"{{value}}\" is not a valid String",
      "Number": "\"{{value}}\" is not a valid Number",
      "Boolean": "\"{{value}}\" is not a valid Boolean",
      "default": "\"{{value}}\" has invalid data type"
    },
    "presence": {
      "true": "is required",
      "": "not present"
    },
    "isEmail": {
      "true": "must be a valid email address",
      "false": "must not be an email address"
    },
    "min": {
      "String": "must have at least {{minCount}} characters",
      "Number": "must be greater than or equal to {{minCount}}",
      "Array": "must have at least {{minCount}} elements"
    },
    "max": {
      "String": "must have less than {{maxCount}} characters", 
      "Number": "must be lower or equal than {{maxCount}}",
      "Array": "must have less than {{maxCount}} elements"
    },
    "only": {
      "singular": "must be \"{{element}}\"",
      "plural": "must be \"{{elements}}\" or \"{{lastElement}}\""
    },
    "strictOnly": {
      "singular": "must be \"{{element}}\"", 
      "plural": "must be \"{{elements}}\" or \"{{lastElement}}\""
    }
  }
}
```

## Custom error messages

You can also set custom error messages for each field. Just use the `errorMessage` property in your field configuration:

```javascript
{
  // one error message for all validations defined for this field
  fieldNameA: {dType: "String", max: 5, min: 3, errorMessage: "Custom error message"},
  // write your own smart error message
  fieldNameB: {dType: "String", max: 5, min: 3, errorMessage: (value, contract, validationName, dType, depth) => "Custom error message"},
  
  // define error messages for each validation rule
  fieldNameB: {dType: "String", max: 5, min: 3, errorMessage:
    {
      min: "Custom min error message",
      max: (value, contract, validationName, dType, depth) => "Custom max error message"
    }
  },

  // you can also define a default error message 
  fieldNameB: {dType: "String", max: 5, min: 3, errorMessage:
    {
      default: "Custom error message, which will be used only for max in this example", // can also be a function
      min: (value, contract, validationName, dType, depth) => "Custom min error message"
    }
  },
}
```

## Automatic Message Translation

When using a `customLocalization` callback, Heimdall Contract can automatically translate your custom error messages. This feature is controlled by the `tryTranslateMessages` configuration option (enabled by default).

```javascript
export default class Contract extends ContractBase {
  setConfig() {
    this.contractConfig.customLocalization = ({translationKey, translationKeys, fallbackValue, context}) => {
      return i18next.t(translationKey, { defaultValue: fallbackValue, ...context })
    }
    this.contractConfig.tryTranslateMessages = true // default: true
  }
}
```

### How it works

When `tryTranslateMessages` is enabled and you have a `customLocalization` callback:

- **String error messages** will be automatically passed to your `customLocalization` callback for translation
- **Function error messages** will NOT be translated (functions are expected to return final messages)
- **Object error messages** with string values will have their string values translated

```javascript
{
  // This will be translated using your customLocalization callback
  fieldA: {dType: "String", presence: true, errorMessage: "custom.error.message"},
  
  // The string values will be translated, but the function will not
  fieldB: {dType: "String", presence: true, errorMessage: {
    presence: "custom.presence.message", // will be translated
    dType: (value, contract) => "Dynamic message" // will NOT be translated
  }},
  
  // Functions are never translated - they should return final messages
  fieldC: {dType: "String", presence: true, errorMessage: () => "Final message"},
}
```

### Benefits

- Universal integration with any translation library through the callback system
- No need to manually call translation functions in your error message definitions
- Flexible: you can still use functions for dynamic messages that shouldn't be translated
- Backward compatible: can be disabled by setting `tryTranslateMessages` to `false`

**Note**: This feature only works when you have provided a `customLocalization` callback. Without it, custom error messages are used as-is.

[back to root](../README.md#Documentation)