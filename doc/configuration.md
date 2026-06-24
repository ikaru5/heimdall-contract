[back to root](../README.md#Documentation)

# Configuration

There is not much to configure atm, but you can use the `setConfig` method also to set your own configurations.
In fact, it is just a life cycle hook, so you can do whatever you want in there.

```Javascript
import ContractBase from "@ikaru5/heimdall-contract"

import i18next from "i18next" // only needed if you want to use i18next to localize your validation messages

export default class Contract extends ContractBase {
  setConfig() {
    // Set up custom localization callback (e.g., for i18next integration)
    this.contractConfig.customLocalization = ({translationKey, translationKeys, fallbackValue, context}) => {
      // Use translationKeys array for i18next fallback support, or single translationKey
      const key = translationKeys && translationKeys.length > 1 ? translationKeys : translationKey
      
      // Pass context data to i18next for interpolation
      return i18next.t(key, { 
        defaultValue: fallbackValue,
        ...context 
      })
    }
    
    this.contractConfig.tryTranslateMessages = true // default is true - automatically trys to translate error messages using customLocalization
    
    // IMPORTANT NOTE: Do not override the whole `contractConfig` property since it also used internally!
  }
}
```

Another available option is `ignoreUnderscoredFields`, which is `false` by default.
When set to `true`, Heimdall skips every field whose key starts with an underscore during `assign`, `toObject`, schema definition and validation.
In addition, validation keywords starting with an underscore inside a field definition (and inside `innerValidate`) are skipped too, so they no longer produce an "Undefined validation" error in the console.
This is handy for meta keywords like "_label" or "_placeholder" (see [Unknown field definition keywords](schema.md#unknown-field-definition-keywords)).

You can set it in `setConfig` or pass it as a constructor option. It is also inherited by nested contracts.

```Javascript
import ContractBase from "@ikaru5/heimdall-contract"

export default class Contract extends ContractBase {
  setConfig() {
    this.contractConfig.ignoreUnderscoredFields = true // default is false - skips fields and validations whose key starts with "_"
  }
}

// or simply pass it as a constructor option
const contract = new ContractBase({schema, ignoreUnderscoredFields: true})
```

[back to root](../README.md#Documentation)