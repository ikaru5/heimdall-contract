[back to root](../README.md#Documentation)

# Localization

There are build-in english simple error messages. You can localize this error messages to your needs.

## i18next

The most of the time you want to use i18next for this. You can find more information about i18next [here](https://www.i18next.com/).
Just tell your base class to use it:

```Javascript
export default class Contract extends ContractBase {
  setConfig() {
    this.contractConfig.localizationMethod = "i18next" // default is "Internal"
    this.contractConfig.i18next = i18n
  }
}
```

## Custom localization method

You can also use your own localization method.

**Warning**: This feature is not final yet. It is ugly to override a private method. So a more elegant solution will be implemented in the future.

Just override the `_getErrorMessageFor` and `_getGenericErrorMessage` method in your base class:

```Javascript
export default class Contract extends ContractBase {
  setConfig() {
    // do not change localizationMethod or i18next config for custom localization method, its simply not needed
    // this.contractConfig.localizationMethod
    // this.contractConfig.i18next
  }
  
  _getErrorMessageFor(propertyValue, propertyConfiguration, dType, depth, validationScope, validationName) {
    return "Some cool error message"
  }

  _getGenericErrorMessage() {
      return "Field invalid!"
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

When using i18next as your localization method, Heimdall Contract can automatically translate your custom error messages. This feature is controlled by the `tryTranslateMessages` configuration option (enabled by default).

```javascript
export default class Contract extends ContractBase {
  setConfig() {
    this.contractConfig.localizationMethod = "i18next"
    this.contractConfig.i18next = i18n
    this.contractConfig.tryTranslateMessages = true // default: true
  }
}
```

### How it works

When `tryTranslateMessages` is enabled and you're using i18next:

- **String error messages** will be automatically passed to `i18n.t()` for translation
- **Function error messages** will NOT be translated (functions are expected to return final messages)
- **Object error messages** with string values will have their string values translated

```javascript
{
  // This will be translated using i18n.t("custom.error.message")
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

- Seamless integration with existing i18next translation keys
- No need to manually call `i18n.t()` in your error message definitions
- Flexible: you can still use functions for dynamic messages that shouldn't be translated
- Backward compatible: can be disabled by setting `tryTranslateMessages` to `false`

**Note**: This feature only works when `localizationMethod` is set to "i18next". With other localization methods, custom error messages are used as-is.

[back to root](../README.md#Documentation)