[back to root](../README.md#Documentation)

# Configuration

There is not much to configure atm, but you can use the `setConfig` method also to set your own configurations.
In fact, it is just a life cycle hook, so you can do whatever you want in there.

```Javascript
import ContractBase from "@ikaru5/heimdall-contract"

import i18n from "i18next" // only needed if you want to use i18next to localize your validation messages

export default class Contract extends ContractBase {
  setConfig() {
    this.contractConfig.localizationMethod = "i18next" // default is "Internal"
    this.contractConfig.i18next = i18n
    
    // IMPORTANT NOTE: Do not override the whole `contractConfig` property since it also used internally!
  }
}
```

[back to root](../README.md#Documentation)